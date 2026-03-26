#!/usr/bin/env python3
"""
Workflow Templates for task.json next_action.

Provides:
    DEFAULT_WORKFLOWS  - Preset workflow templates
    get_workflow       - Get workflow by type
    validate_workflow  - Validate workflow configuration
"""

from __future__ import annotations

from typing import TypedDict


class PhaseConfig(TypedDict, total=False):
    """Configuration for a single phase."""

    phase: int
    action: str
    gate: str | None  # Gate to check before this phase
    loop: dict | None  # Loop configuration: {"max": N, "gate": "..."}


class WorkflowConfig(TypedDict):
    """Complete workflow configuration."""

    type: str
    requires_tdd: bool
    requires_review: bool
    phases: list[PhaseConfig]


# =============================================================================
# Default Workflow Templates
# =============================================================================

DEFAULT_WORKFLOWS: dict[str, WorkflowConfig] = {
    "default": {
        "type": "default",
        "requires_tdd": False,
        "requires_review": False,
        "phases": [
            {"phase": 1, "action": "implement", "gate": None, "loop": None},
            {
                "phase": 2,
                "action": "check",
                "gate": None,
                "loop": {"max": 5, "gate": "lint_and_typecheck_pass"},
            },
            {"phase": 3, "action": "finish", "gate": None, "loop": None},
            {"phase": 4, "action": "create-pr", "gate": None, "loop": None},
        ],
    },
    "quick-fix": {
        "type": "quick-fix",
        "requires_tdd": False,
        "requires_review": False,
        "phases": [
            {"phase": 1, "action": "implement", "gate": None, "loop": None},
            {
                "phase": 2,
                "action": "check",
                "gate": None,
                "loop": {"max": 3, "gate": "lint_and_typecheck_pass"},
            },
            {"phase": 3, "action": "create-pr", "gate": None, "loop": None},
        ],
    },
    "with-tdd": {
        "type": "with-tdd",
        "requires_tdd": True,
        "requires_review": False,
        "phases": [
            {"phase": 1, "action": "tdd", "gate": None, "loop": None},
            {"phase": 2, "action": "implement", "gate": "tests_written", "loop": None},
            {
                "phase": 3,
                "action": "check",
                "gate": None,
                "loop": {"max": 5, "gate": "lint_and_typecheck_pass"},
            },
            {"phase": 4, "action": "finish", "gate": "spec_updated", "loop": None},
            {"phase": 5, "action": "create-pr", "gate": None, "loop": None},
        ],
    },
    "with-review": {
        "type": "with-review",
        "requires_tdd": False,
        "requires_review": True,
        "phases": [
            {"phase": 1, "action": "implement", "gate": None, "loop": None},
            {
                "phase": 2,
                "action": "check",
                "gate": None,
                "loop": {"max": 5, "gate": "lint_and_typecheck_pass"},
            },
            {"phase": 3, "action": "review", "gate": None, "loop": None},
            {"phase": 4, "action": "finish", "gate": "spec_updated", "loop": None},
            {"phase": 5, "action": "create-pr", "gate": None, "loop": None},
        ],
    },
    "docs-only": {
        "type": "docs-only",
        "requires_tdd": False,
        "requires_review": False,
        "phases": [
            {"phase": 1, "action": "implement", "gate": None, "loop": None},
            {
                "phase": 2,
                "action": "check",
                "gate": None,
                "loop": {"max": 3, "gate": "lint_pass"},
            },
        ],
    },
    "debug": {
        "type": "debug",
        "requires_tdd": False,
        "requires_review": False,
        "phases": [
            {"phase": 1, "action": "debug-systematic", "gate": None, "loop": None},
            {"phase": 2, "action": "implement", "gate": "root_cause_found", "loop": None},
            {
                "phase": 3,
                "action": "check",
                "gate": None,
                "loop": {"max": 5, "gate": "lint_and_typecheck_pass"},
            },
            {"phase": 4, "action": "create-pr", "gate": None, "loop": None},
        ],
    },
    "research": {
        "type": "research",
        "requires_tdd": False,
        "requires_review": False,
        "phases": [
            {"phase": 1, "action": "research", "gate": None, "loop": None},
            {"phase": 2, "action": "brainstorm", "gate": None, "loop": None},
            {"phase": 3, "action": "implement", "gate": None, "loop": None},
            {
                "phase": 4,
                "action": "check",
                "gate": None,
                "loop": {"max": 5, "gate": "lint_and_typecheck_pass"},
            },
        ],
    },
}


# =============================================================================
# Helper Functions
# =============================================================================


def get_workflow(workflow_type: str) -> WorkflowConfig | None:
    """Get workflow configuration by type.

    Args:
        workflow_type: Workflow type name (e.g., "default", "quick-fix", "with-tdd")

    Returns:
        WorkflowConfig if found, None otherwise
    """
    return DEFAULT_WORKFLOWS.get(workflow_type)


def get_next_action_from_workflow(workflow: WorkflowConfig) -> list[dict]:
    """Extract next_action list from workflow configuration.

    Args:
        workflow: Workflow configuration

    Returns:
        List of phase actions compatible with task.json next_action format
    """
    result = []
    for phase in workflow["phases"]:
        entry = {"phase": phase["phase"], "action": phase["action"]}
        if phase.get("gate"):
            entry["gate"] = phase["gate"]
        if phase.get("loop"):
            entry["loop"] = phase["loop"]
        result.append(entry)
    return result


def validate_workflow(workflow: WorkflowConfig) -> list[str]:
    """Validate workflow configuration.

    Args:
        workflow: Workflow configuration to validate

    Returns:
        List of validation errors (empty if valid)
    """
    errors = []

    if not workflow.get("type"):
        errors.append("Workflow must have a 'type' field")

    phases = workflow.get("phases", [])
    if not phases:
        errors.append("Workflow must have at least one phase")

    seen_phases = set()
    seen_actions = set()

    for i, phase in enumerate(phases):
        # Check required fields
        if "phase" not in phase:
            errors.append(f"Phase {i}: missing 'phase' number")
        elif phase["phase"] in seen_phases:
            errors.append(f"Phase {i}: duplicate phase number {phase['phase']}")
        else:
            seen_phases.add(phase["phase"])

        if "action" not in phase:
            errors.append(f"Phase {i}: missing 'action'")
        else:
            seen_actions.add(phase["action"])

        # Validate loop configuration
        if "loop" in phase and phase["loop"]:
            loop = phase["loop"]
            if "max" not in loop:
                errors.append(f"Phase {i}: loop config missing 'max'")
            if "gate" not in loop:
                errors.append(f"Phase {i}: loop config missing 'gate'")

    # Check phase numbering starts at 1 and is sequential
    expected_phases = set(range(1, len(phases) + 1))
    if seen_phases != expected_phases:
        errors.append(
            f"Phase numbers should be sequential from 1, got: {sorted(seen_phases)}"
        )

    return errors


def list_workflows() -> list[str]:
    """List available workflow types.

    Returns:
        List of workflow type names
    """
    return list(DEFAULT_WORKFLOWS.keys())


def get_workflow_description(workflow_type: str) -> str:
    """Get human-readable description of workflow type.

    Args:
        workflow_type: Workflow type name

    Returns:
        Description string
    """
    descriptions = {
        "default": "Standard 4-phase workflow: implement → check → finish → create-pr",
        "quick-fix": "Fast 3-phase for urgent fixes: implement → check → create-pr",
        "with-tdd": "Quality-first with TDD: tdd → implement → check → finish → create-pr",
        "with-review": "Team workflow with review: implement → check → review → finish → create-pr",
        "docs-only": "Documentation tasks: implement → check (no PR)",
        "debug": "Bug fix workflow: debug-systematic → implement → check → create-pr",
        "research": "Exploratory tasks: research → brainstorm → implement → check",
    }
    return descriptions.get(workflow_type, "Unknown workflow type")
