"""
Tests for safe upload path handling.
"""
import pytest
from pathlib import Path
from uploads import safe_upload_path


def test_safe_filename():
    """Valid filename stays within base directory."""
    result = safe_upload_path("/var/uploads", "document.pdf")
    assert str(result) == str(Path("/var/uploads/document.pdf").resolve())


def test_nested_safe_filename():
    """Valid nested path stays within base directory."""
    result = safe_upload_path("/var/uploads", "user123/document.pdf")
    assert str(result) == str(Path("/var/uploads/user123/document.pdf").resolve())


def test_path_traversal_attack():
    """Directory traversal attempt is rejected."""
    with pytest.raises(ValueError, match="path traversal detected"):
        safe_upload_path("/var/uploads", "../../../etc/passwd")


def test_absolute_path_attack():
    """Absolute path attempt is rejected."""
    with pytest.raises(ValueError, match="path traversal detected"):
        safe_upload_path("/var/uploads", "/etc/passwd")


def test_mixed_traversal():
    """Mixed valid and traversal components are rejected."""
    with pytest.raises(ValueError, match="path traversal detected"):
        safe_upload_path("/var/uploads", "subdir/../../etc/passwd")
