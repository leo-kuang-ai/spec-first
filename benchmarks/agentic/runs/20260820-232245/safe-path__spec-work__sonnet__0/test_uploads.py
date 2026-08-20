import os

import pytest

from uploads import safe_upload_path


def test_joins_simple_filename(tmp_path):
    result = safe_upload_path(str(tmp_path), "photo.png")
    assert result == os.path.realpath(os.path.join(str(tmp_path), "photo.png"))


def test_strips_relative_traversal(tmp_path):
    result = safe_upload_path(str(tmp_path), "../../etc/passwd")
    assert result == os.path.realpath(os.path.join(str(tmp_path), "passwd"))


def test_strips_absolute_path(tmp_path):
    result = safe_upload_path(str(tmp_path), "/etc/passwd")
    assert result == os.path.realpath(os.path.join(str(tmp_path), "passwd"))


def test_strips_windows_style_traversal(tmp_path):
    result = safe_upload_path(str(tmp_path), "..\\..\\windows\\system32\\config")
    assert result == os.path.realpath(os.path.join(str(tmp_path), "config"))


def test_rejects_empty_filename(tmp_path):
    with pytest.raises(ValueError):
        safe_upload_path(str(tmp_path), "")


def test_rejects_dot(tmp_path):
    with pytest.raises(ValueError):
        safe_upload_path(str(tmp_path), ".")


def test_rejects_dotdot(tmp_path):
    with pytest.raises(ValueError):
        safe_upload_path(str(tmp_path), "..")


def test_rejects_escape_via_symlink_inside_base(tmp_path):
    base = tmp_path / "base"
    base.mkdir()
    outside = tmp_path / "outside"
    outside.mkdir()

    # A symlink named like a normal file, but pointing outside base_dir.
    (base / "link").symlink_to(outside)

    with pytest.raises(ValueError):
        safe_upload_path(str(base), "link")
