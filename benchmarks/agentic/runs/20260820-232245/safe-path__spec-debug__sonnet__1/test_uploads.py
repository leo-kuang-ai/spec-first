import os
import pytest

from uploads import safe_upload_path


def test_simple_filename_joins_into_base_dir(tmp_path):
    result = safe_upload_path(str(tmp_path), "photo.png")
    assert result == os.path.realpath(str(tmp_path / "photo.png"))


def test_parent_traversal_is_blocked(tmp_path):
    result = safe_upload_path(str(tmp_path), "../../etc/passwd")
    assert result == os.path.realpath(str(tmp_path / "passwd"))


def test_absolute_path_is_blocked(tmp_path):
    result = safe_upload_path(str(tmp_path), "/etc/passwd")
    assert result == os.path.realpath(str(tmp_path / "passwd"))


def test_nested_traversal_with_subdirs_is_blocked(tmp_path):
    result = safe_upload_path(str(tmp_path), "a/b/../../../secret")
    assert result == os.path.realpath(str(tmp_path / "secret"))


def test_empty_filename_rejected(tmp_path):
    with pytest.raises(ValueError):
        safe_upload_path(str(tmp_path), "")


def test_dot_and_dotdot_rejected(tmp_path):
    with pytest.raises(ValueError):
        safe_upload_path(str(tmp_path), ".")
    with pytest.raises(ValueError):
        safe_upload_path(str(tmp_path), "..")


def test_preexisting_symlink_escape_is_blocked(tmp_path):
    outside = tmp_path.parent / "outside_secret"
    outside.write_text("secret")
    base = tmp_path / "base"
    base.mkdir()
    (base / "evil").symlink_to(outside)

    with pytest.raises(ValueError):
        safe_upload_path(str(base), "evil")
