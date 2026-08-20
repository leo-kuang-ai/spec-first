import os
import tempfile

import pytest

from uploads import safe_upload_path


@pytest.fixture
def base_dir():
    with tempfile.TemporaryDirectory() as d:
        yield d


def test_simple_filename(base_dir):
    result = safe_upload_path(base_dir, "report.pdf")
    assert result == os.path.join(os.path.realpath(base_dir), "report.pdf")


def test_rejects_parent_traversal(base_dir):
    with pytest.raises(ValueError):
        safe_upload_path(base_dir, "../../etc/passwd")


def test_strips_embedded_traversal_to_basename(base_dir):
    # Embedded traversal segments are stripped along with any directory
    # component; only the final path segment is used.
    result = safe_upload_path(base_dir, "foo/../../bar/evil.txt")
    assert result == os.path.join(os.path.realpath(base_dir), "evil.txt")


def test_rejects_absolute_path(base_dir):
    result = safe_upload_path(base_dir, "/etc/passwd")
    assert result == os.path.join(os.path.realpath(base_dir), "passwd")


def test_rejects_windows_style_traversal(base_dir):
    result = safe_upload_path(base_dir, "..\\..\\windows\\system32\\evil.dll")
    assert result == os.path.join(os.path.realpath(base_dir), "evil.dll")


def test_rejects_empty_filename(base_dir):
    with pytest.raises(ValueError):
        safe_upload_path(base_dir, "")


def test_rejects_dot_and_dotdot(base_dir):
    with pytest.raises(ValueError):
        safe_upload_path(base_dir, ".")
    with pytest.raises(ValueError):
        safe_upload_path(base_dir, "..")


def test_preserves_dotfiles(base_dir):
    result = safe_upload_path(base_dir, ".htaccess")
    assert result == os.path.join(os.path.realpath(base_dir), ".htaccess")
