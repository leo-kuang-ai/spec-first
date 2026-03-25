#!/bin/bash

# Migration script: Convert features to unified tasks system
# Usage: ./migrate-features-to-tasks.sh [--dry-run] [project-dir]
#
# This script converts the old features structure to the new unified tasks system:
# - .spec-first/workspace/{developer}/features/{name}/ -> .spec-first/tasks/{MM}-{DD}-{name}-{developer}/
# - feature.json -> task.json (with field conversions)
#
# Note: This script expects the project to have already been updated to 0.2.0+
# (i.e., agent-traces renamed to workspace)

set -e

DRY_RUN=false
PROJECT_DIR="."

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            PROJECT_DIR="$1"
            shift
            ;;
    esac
done

# Resolve absolute path
PROJECT_DIR=$(cd "$PROJECT_DIR" && pwd)
SPEC_FIRST_DIR="$PROJECT_DIR/.spec-first"

# Check if .spec-first exists
if [[ ! -d "$SPEC_FIRST_DIR" ]]; then
    echo "Error: .spec-first directory not found in $PROJECT_DIR"
    exit 1
fi

# Determine the workspace directory (could be workspace or agent-traces if not yet updated)
if [[ -d "$SPEC_FIRST_DIR/workspace" ]]; then
    WORKSPACE_DIR="$SPEC_FIRST_DIR/workspace"
elif [[ -d "$SPEC_FIRST_DIR/agent-traces" ]]; then
    WORKSPACE_DIR="$SPEC_FIRST_DIR/agent-traces"
    echo "Warning: Found agent-traces instead of workspace. Run 'spec-first update' first."
    echo "Continuing anyway..."
else
    echo "Error: Neither workspace nor agent-traces directory found"
    exit 1
fi

# Ensure tasks directory exists
TASKS_DIR="$SPEC_FIRST_DIR/tasks"
if [[ "$DRY_RUN" == "false" ]]; then
    mkdir -p "$TASKS_DIR"
fi

echo "=== Feature to Task Migration ==="
echo "Project: $PROJECT_DIR"
echo "Workspace: $WORKSPACE_DIR"
echo "Tasks: $TASKS_DIR"
echo "Dry run: $DRY_RUN"
echo ""

# Convert feature.json to task.json
convert_feature_to_task() {
    local feature_json="$1"
    local output_file="$2"
    local dir_name="$3"
    local developer="$4"

    if [[ ! -f "$feature_json" ]]; then
        # Create minimal task.json for features without feature.json
        echo "  Warning: No feature.json found, creating minimal task.json"
        cat > "$output_file" << EOF
{
  "id": "$dir_name",
  "name": "$dir_name",
  "title": "$dir_name",
  "description": "",
  "status": "unknown",
  "dev_type": null,
  "scope": null,
  "priority": "P2",
  "creator": "$developer",
  "assignee": "$developer",
  "createdAt": null,
  "completedAt": null,
  "branch": null,
  "base_branch": null,
  "worktree_path": null,
  "current_phase": 0,
  "next_action": [{"phase":1,"action":"implement"},{"phase":2,"action":"check"},{"phase":3,"action":"finish"},{"phase":4,"action":"create-pr"}],
  "commit": null,
  "pr_url": null,
  "subtasks": [],
  "relatedFiles": [],
  "notes": "Migrated from feature without feature.json"
}
EOF
        return
    fi

    # Read existing feature.json and convert
    local id=$(jq -r '.id // empty' "$feature_json")
    local name=$(jq -r '.name // empty' "$feature_json")
    local title=$(jq -r '.title // .name // empty' "$feature_json")
    local description=$(jq -r '.description // ""' "$feature_json")
    local status=$(jq -r '.status // "unknown"' "$feature_json")
    local dev_type=$(jq -r '.dev_type // null' "$feature_json")
    # Convert old priority format to new P0-P3 format
    local raw_priority=$(jq -r '.priority // "P2"' "$feature_json")
    local priority="$raw_priority"
    case "$raw_priority" in
        high) priority="P1" ;;
        medium) priority="P2" ;;
        low) priority="P3" ;;
    esac
    local old_developer=$(jq -r '.developer // empty' "$feature_json")
    local createdAt=$(jq -r '.createdAt // null' "$feature_json")
    local completedAt=$(jq -r '.completedAt // null' "$feature_json")
    local commit=$(jq -r '.commit // null' "$feature_json")
    local subtasks=$(jq -c '.subtasks // []' "$feature_json")
    local relatedFiles=$(jq -c '.relatedFiles // []' "$feature_json")
    local notes=$(jq -r '.notes // ""' "$feature_json")

    # Use old developer if available, otherwise use the directory developer
    local creator="${old_developer:-$developer}"

    # Generate task.json
    jq -n \
        --arg id "$id" \
        --arg name "$name" \
        --arg title "$title" \
        --arg description "$description" \
        --arg status "$status" \
        --arg dev_type "$dev_type" \
        --arg priority "$priority" \
        --arg creator "$creator" \
        --arg assignee "$creator" \
        --arg createdAt "$createdAt" \
        --arg completedAt "$completedAt" \
        --arg commit "$commit" \
        --argjson subtasks "$subtasks" \
        --argjson relatedFiles "$relatedFiles" \
        --arg notes "$notes" \
        '{
          id: $id,
          name: $name,
          title: $title,
          description: $description,
          status: $status,
          dev_type: (if $dev_type == "null" then null else $dev_type end),
          scope: null,
          priority: $priority,
          creator: $creator,
          assignee: $assignee,
          createdAt: (if $createdAt == "null" then null else $createdAt end),
          completedAt: (if $completedAt == "null" then null else $completedAt end),
          branch: null,
          base_branch: null,
          worktree_path: null,
          current_phase: 0,
          next_action: [{"phase":1,"action":"implement"},{"phase":2,"action":"check"},{"phase":3,"action":"finish"},{"phase":4,"action":"create-pr"}],
          commit: (if $commit == "null" then null else $commit end),
          pr_url: null,
          subtasks: $subtasks,
          relatedFiles: $relatedFiles,
          notes: $notes
        }' > "$output_file"
}

# Process a single feature directory
process_feature() {
    local feature_dir="$1"
    local developer="$2"
    local is_archived="$3"

    local dir_name=$(basename "$feature_dir")

    # Extract date prefix from directory name (e.g., "21-pkb-merge" -> "21")
    local day_prefix=""
    if [[ "$dir_name" =~ ^([0-9]{2})- ]]; then
        day_prefix="${BASH_REMATCH[1]}"
    elif [[ "$dir_name" =~ ^([0-9]{1})- ]]; then
        day_prefix="0${BASH_REMATCH[1]}"
    fi

    # Get month from archive path or current month
    local month_prefix="01"  # Default to January
    if [[ "$is_archived" == "true" && "$feature_dir" =~ /archive/([0-9]{4})-([0-9]{2})/ ]]; then
        month_prefix="${BASH_REMATCH[2]}"
    fi

    # Build new task directory name: {MM}-{DD}-{name}-{developer}
    local task_name="${month_prefix}-${day_prefix}-${dir_name#*-}-${developer}"
    # Handle case where dir_name doesn't have a day prefix
    if [[ -z "$day_prefix" ]]; then
        task_name="${month_prefix}-00-${dir_name}-${developer}"
    fi

    local target_dir="$TASKS_DIR/$task_name"

    # Handle archived features - put them in tasks/archive/
    if [[ "$is_archived" == "true" ]]; then
        local archive_month=""
        if [[ "$feature_dir" =~ /archive/([0-9]{4}-[0-9]{2})/ ]]; then
            archive_month="${BASH_REMATCH[1]}"
        fi
        target_dir="$TASKS_DIR/archive/$archive_month/$task_name"
    fi

    # Show relative path from TASKS_DIR
    local relative_target="${target_dir#$TASKS_DIR/}"
    echo "  $dir_name -> tasks/$relative_target"

    if [[ "$DRY_RUN" == "true" ]]; then
        return
    fi

    # Create target directory
    mkdir -p "$target_dir"

    # Copy all files except feature.json
    for file in "$feature_dir"/*; do
        if [[ -f "$file" && "$(basename "$file")" != "feature.json" ]]; then
            cp "$file" "$target_dir/"
        elif [[ -d "$file" ]]; then
            cp -r "$file" "$target_dir/"
        fi
    done

    # Convert feature.json to task.json
    convert_feature_to_task "$feature_dir/feature.json" "$target_dir/task.json" "$dir_name" "$developer"
}

# Find and process all features
FEATURE_COUNT=0
ARCHIVE_COUNT=0

for developer_dir in "$WORKSPACE_DIR"/*/; do
    developer=$(basename "$developer_dir")

    # Skip non-developer directories
    if [[ "$developer" == "index.md" || ! -d "$developer_dir" ]]; then
        continue
    fi

    features_dir="$developer_dir/features"
    if [[ ! -d "$features_dir" ]]; then
        continue
    fi

    echo "Processing developer: $developer"

    # Process active features
    for feature_dir in "$features_dir"/*/; do
        if [[ -d "$feature_dir" && "$(basename "$feature_dir")" != "archive" ]]; then
            process_feature "$feature_dir" "$developer" "false"
            ((FEATURE_COUNT++))
        fi
    done

    # Process archived features
    archive_dir="$features_dir/archive"
    if [[ -d "$archive_dir" ]]; then
        for month_dir in "$archive_dir"/*/; do
            if [[ -d "$month_dir" ]]; then
                for feature_dir in "$month_dir"/*/; do
                    if [[ -d "$feature_dir" ]]; then
                        process_feature "$feature_dir" "$developer" "true"
                        ((ARCHIVE_COUNT++))
                    fi
                done
            fi
        done
    fi
done

echo ""
echo "=== Summary ==="
echo "Active features migrated: $FEATURE_COUNT"
echo "Archived features migrated: $ARCHIVE_COUNT"
echo "Total: $((FEATURE_COUNT + ARCHIVE_COUNT))"

if [[ "$DRY_RUN" == "true" ]]; then
    echo ""
    echo "(Dry run - no changes made)"
else
    # Clean up: delete old features directories
    echo ""
    echo "Cleaning up old features directories..."

    CLEANUP_COUNT=0

    for developer_dir in "$WORKSPACE_DIR"/*/; do
        developer=$(basename "$developer_dir")

        if [[ "$developer" == "index.md" || ! -d "$developer_dir" ]]; then
            continue
        fi

        # Delete old features directory
        features_dir="$developer_dir/features"
        if [[ -d "$features_dir" ]]; then
            rm -rf "$features_dir"
            echo "  Removed: $features_dir"
            ((CLEANUP_COUNT++))
        fi
    done

    if [[ $CLEANUP_COUNT -gt 0 ]]; then
        echo "  Removed $CLEANUP_COUNT features director(ies)"
    fi

    echo ""
    echo "Migration complete!"
fi
