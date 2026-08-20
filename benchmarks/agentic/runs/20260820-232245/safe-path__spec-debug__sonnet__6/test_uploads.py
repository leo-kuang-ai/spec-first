import pytest
import tempfile
from pathlib import Path
from uploads import safe_upload_path


def test_safe_upload_path_normal_filename():
    """Test with a normal filename"""
    with tempfile.TemporaryDirectory() as tmpdir:
        result = safe_upload_path(tmpdir, "document.pdf")
        expected = str(Path(tmpdir).resolve() / "document.pdf")
        assert result == expected


def test_safe_upload_path_nested_filename():
    """Test with a nested path within base_dir"""
    with tempfile.TemporaryDirectory() as tmpdir:
        result = safe_upload_path(tmpdir, "subfolder/image.png")
        expected = str(Path(tmpdir).resolve() / "subfolder" / "image.png")
        assert result == expected


def test_safe_upload_path_blocks_parent_traversal():
    """Test that ../ path traversal is blocked"""
    with tempfile.TemporaryDirectory() as tmpdir:
        with pytest.raises(ValueError, match="Path traversal detected"):
            safe_upload_path(tmpdir, "../etc/passwd")


def test_safe_upload_path_blocks_multiple_parent_traversal():
    """Test that multiple ../ are blocked"""
    with tempfile.TemporaryDirectory() as tmpdir:
        with pytest.raises(ValueError, match="Path traversal detected"):
            safe_upload_path(tmpdir, "../../etc/passwd")


def test_safe_upload_path_blocks_absolute_path():
    """Test that absolute paths are blocked"""
    with tempfile.TemporaryDirectory() as tmpdir:
        with pytest.raises(ValueError, match="Path traversal detected"):
            safe_upload_path(tmpdir, "/etc/passwd")


def test_safe_upload_path_blocks_mixed_traversal():
    """Test that mixed valid/invalid path components are blocked"""
    with tempfile.TemporaryDirectory() as tmpdir:
        with pytest.raises(ValueError, match="Path traversal detected"):
            safe_upload_path(tmpdir, "uploads/../../etc/passwd")


def test_safe_upload_path_allows_current_dir_reference():
    """Test that ./ references within base_dir are allowed"""
    with tempfile.TemporaryDirectory() as tmpdir:
        result = safe_upload_path(tmpdir, "./document.pdf")
        expected = str(Path(tmpdir).resolve() / "document.pdf")
        assert result == expected


def test_safe_upload_path_normalizes_path():
    """Test that redundant path separators are normalized"""
    with tempfile.TemporaryDirectory() as tmpdir:
        result = safe_upload_path(tmpdir, "folder//file.txt")
        expected = str(Path(tmpdir).resolve() / "folder" / "file.txt")
        assert result == expected
