import pytest
from pathlib import Path
from uploads import safe_upload_path


def test_safe_filename():
    """Test that safe filenames are accepted."""
    result = safe_upload_path("/uploads", "file.txt")
    assert result == str(Path("/uploads/file.txt").resolve())


def test_safe_subdirectory():
    """Test that subdirectories within base_dir are allowed."""
    result = safe_upload_path("/uploads", "subdir/file.txt")
    assert result == str(Path("/uploads/subdir/file.txt").resolve())


def test_rejects_parent_traversal():
    """Test that .. path traversal is rejected."""
    with pytest.raises(ValueError, match="Path traversal detected"):
        safe_upload_path("/uploads", "../etc/passwd")


def test_rejects_multiple_parent_traversal():
    """Test that multiple .. sequences are rejected."""
    with pytest.raises(ValueError, match="Path traversal detected"):
        safe_upload_path("/uploads", "../../etc/passwd")


def test_rejects_absolute_path():
    """Test that absolute paths in filename are rejected."""
    with pytest.raises(ValueError, match="Absolute paths not allowed"):
        safe_upload_path("/uploads", "/etc/passwd")


def test_rejects_mixed_traversal():
    """Test that mixed valid/invalid path components are rejected."""
    with pytest.raises(ValueError, match="Path traversal detected"):
        safe_upload_path("/uploads", "subdir/../../etc/passwd")


def test_rejects_hidden_traversal():
    """Test that traversal hidden in valid-looking paths is rejected."""
    with pytest.raises(ValueError, match="Path traversal detected"):
        safe_upload_path("/uploads", "safe/../../../etc/passwd")


def test_safe_with_dots_in_filename():
    """Test that dots in filename (not path traversal) are allowed."""
    result = safe_upload_path("/uploads", "my.file.name.txt")
    assert result == str(Path("/uploads/my.file.name.txt").resolve())


def test_relative_base_dir():
    """Test that relative base_dir is resolved correctly."""
    result = safe_upload_path("uploads", "file.txt")
    expected = str((Path.cwd() / "uploads" / "file.txt").resolve())
    assert result == expected


def test_empty_filename():
    """Test handling of empty filename."""
    result = safe_upload_path("/uploads", "")
    assert result == str(Path("/uploads").resolve())


def test_current_dir_reference():
    """Test that ./ references are handled safely."""
    result = safe_upload_path("/uploads", "./file.txt")
    assert result == str(Path("/uploads/file.txt").resolve())
