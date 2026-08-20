import os
import pytest
from pathlib import Path
from uploads import safe_upload_path


def test_safe_upload_path_normal_filename(tmp_path):
    """Test with a normal, safe filename."""
    result = safe_upload_path(tmp_path, "document.pdf")
    expected = str(tmp_path / "document.pdf")
    assert result == expected


def test_safe_upload_path_blocks_parent_traversal(tmp_path):
    """Test that ../ path traversal is blocked."""
    with pytest.raises(ValueError, match="path traversal detected"):
        safe_upload_path(tmp_path, "../etc/passwd")


def test_safe_upload_path_blocks_multiple_parent_traversal(tmp_path):
    """Test that ../../ path traversal is blocked."""
    with pytest.raises(ValueError, match="path traversal detected"):
        safe_upload_path(tmp_path, "../../etc/passwd")


def test_safe_upload_path_blocks_absolute_path(tmp_path):
    """Test that absolute paths are blocked."""
    with pytest.raises(ValueError, match="path traversal detected"):
        safe_upload_path(tmp_path, "/etc/passwd")


def test_safe_upload_path_strips_directory_components(tmp_path):
    """Test that directory components in filename are stripped."""
    result = safe_upload_path(tmp_path, "subdir/file.txt")
    expected = str(tmp_path / "file.txt")
    assert result == expected


def test_safe_upload_path_empty_filename(tmp_path):
    """Test that empty filename is rejected."""
    with pytest.raises(ValueError, match="cannot be empty"):
        safe_upload_path(tmp_path, "")


def test_safe_upload_path_whitespace_only(tmp_path):
    """Test that whitespace-only filename is rejected."""
    with pytest.raises(ValueError, match="cannot be empty"):
        safe_upload_path(tmp_path, "   ")


def test_safe_upload_path_dot_filename(tmp_path):
    """Test that '.' as filename is rejected."""
    with pytest.raises(ValueError, match="Invalid filename"):
        safe_upload_path(tmp_path, ".")


def test_safe_upload_path_dotdot_filename(tmp_path):
    """Test that '..' as filename is rejected."""
    with pytest.raises(ValueError, match="Invalid filename"):
        safe_upload_path(tmp_path, "..")


def test_safe_upload_path_complex_traversal_attempt(tmp_path):
    """Test complex path traversal with mixed components."""
    with pytest.raises(ValueError, match="path traversal detected"):
        safe_upload_path(tmp_path, "safe/../../../etc/passwd")


def test_safe_upload_path_filename_with_spaces(tmp_path):
    """Test that filenames with spaces are handled correctly."""
    result = safe_upload_path(tmp_path, "my document.pdf")
    expected = str(tmp_path / "my document.pdf")
    assert result == expected


def test_safe_upload_path_unicode_filename(tmp_path):
    """Test that unicode filenames are handled correctly."""
    result = safe_upload_path(tmp_path, "文档.pdf")
    expected = str(tmp_path / "文档.pdf")
    assert result == expected


def test_safe_upload_path_special_characters(tmp_path):
    """Test filename with special but safe characters."""
    result = safe_upload_path(tmp_path, "file-name_2024.tar.gz")
    expected = str(tmp_path / "file-name_2024.tar.gz")
    assert result == expected
