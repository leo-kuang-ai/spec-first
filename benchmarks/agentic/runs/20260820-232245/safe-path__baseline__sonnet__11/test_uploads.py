import os

import pytest

from uploads import safe_upload_path


def test_simple_filename(tmp_path):
    result = safe_upload_path(str(tmp_path), "report.pdf")
    assert result == os.path.realpath(os.path.join(str(tmp_path), "report.pdf"))


def test_strips_parent_traversal_to_basename(tmp_path):
    # basename() reduces this to "passwd", which resolves safely inside base_dir
    result = safe_upload_path(str(tmp_path), "../../etc/passwd")
    assert result == os.path.realpath(os.path.join(str(tmp_path), "passwd"))


def test_strips_absolute_path_to_basename(tmp_path):
    result = safe_upload_path(str(tmp_path), "/etc/passwd")
    assert result == os.path.realpath(os.path.join(str(tmp_path), "passwd"))


def test_rejects_empty_filename(tmp_path):
    with pytest.raises(ValueError):
        safe_upload_path(str(tmp_path), "")


def test_rejects_dot_and_dotdot(tmp_path):
    with pytest.raises(ValueError):
        safe_upload_path(str(tmp_path), ".")
    with pytest.raises(ValueError):
        safe_upload_path(str(tmp_path), "..")


def test_rejects_null_byte(tmp_path):
    with pytest.raises(ValueError):
        safe_upload_path(str(tmp_path), "evil\x00.txt")
