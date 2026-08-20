import pytest
import tempfile
import os
from pathlib import Path
from uploads import safe_upload_path


def test_safe_filename():
    """Test that safe filenames work correctly."""
    with tempfile.TemporaryDirectory() as tmpdir:
        result = safe_upload_path(tmpdir, "test.txt")
        expected = os.path.join(tmpdir, "test.txt")
        assert result == expected


def test_nested_safe_filename():
    """Test that nested safe paths work correctly."""
    with tempfile.TemporaryDirectory() as tmpdir:
        result = safe_upload_path(tmpdir, "subdir/test.txt")
        expected = str(Path(tmpdir) / "subdir" / "test.txt")
        assert result == expected


def test_path_traversal_parent():
    """Test that parent directory traversal is blocked."""
    with tempfile.TemporaryDirectory() as tmpdir:
        with pytest.raises(ValueError, match="Path traversal attempt detected"):
            safe_upload_path(tmpdir, "../etc/passwd")


def test_path_traversal_multiple_parents():
    """Test that multiple parent directory traversals are blocked."""
    with tempfile.TemporaryDirectory() as tmpdir:
        with pytest.raises(ValueError, match="Path traversal attempt detected"):
            safe_upload_path(tmpdir, "../../../../../../etc/passwd")


def test_path_traversal_mixed():
    """Test that mixed path traversal attempts are blocked."""
    with tempfile.TemporaryDirectory() as tmpdir:
        with pytest.raises(ValueError, match="Path traversal attempt detected"):
            safe_upload_path(tmpdir, "uploads/../../../etc/passwd")


def test_absolute_path_unix():
    """Test that absolute Unix paths are blocked."""
    with tempfile.TemporaryDirectory() as tmpdir:
        with pytest.raises(ValueError, match="Path traversal attempt detected"):
            safe_upload_path(tmpdir, "/etc/passwd")


def test_absolute_path_windows():
    """Test that absolute Windows paths are blocked."""
    with tempfile.TemporaryDirectory() as tmpdir:
        with pytest.raises(ValueError, match="Path traversal attempt detected"):
            safe_upload_path(tmpdir, "C:\\Windows\\System32\\config\\sam")


def test_empty_filename():
    """Test that empty filenames are rejected."""
    with tempfile.TemporaryDirectory() as tmpdir:
        with pytest.raises(ValueError, match="Filename cannot be empty"):
            safe_upload_path(tmpdir, "")


def test_none_filename():
    """Test that None filenames are rejected."""
    with tempfile.TemporaryDirectory() as tmpdir:
        with pytest.raises(ValueError, match="Filename cannot be empty"):
            safe_upload_path(tmpdir, None)


def test_special_characters():
    """Test that filenames with special characters are handled safely."""
    with tempfile.TemporaryDirectory() as tmpdir:
        result = safe_upload_path(tmpdir, "file@#$%.txt")
        expected = str(Path(tmpdir) / "file@#$%.txt")
        assert result == expected


def test_unicode_filename():
    """Test that Unicode filenames work correctly."""
    with tempfile.TemporaryDirectory() as tmpdir:
        result = safe_upload_path(tmpdir, "文件名.txt")
        expected = str(Path(tmpdir) / "文件名.txt")
        assert result == expected


def test_dot_prefix():
    """Test that dot-prefixed files (hidden files) work correctly."""
    with tempfile.TemporaryDirectory() as tmpdir:
        result = safe_upload_path(tmpdir, ".hidden")
        expected = str(Path(tmpdir) / ".hidden")
        assert result == expected


def test_current_directory_reference():
    """Test that current directory references are handled correctly."""
    with tempfile.TemporaryDirectory() as tmpdir:
        result = safe_upload_path(tmpdir, "./test.txt")
        expected = str(Path(tmpdir) / "test.txt")
        assert result == expected
