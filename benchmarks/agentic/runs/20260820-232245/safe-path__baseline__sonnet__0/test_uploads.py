import os

import pytest

from uploads import safe_upload_path


@pytest.fixture
def base_dir(tmp_path):
    d = tmp_path / "uploads"
    d.mkdir()
    return str(d)


def test_simple_filename_joins_into_base_dir(base_dir):
    result = safe_upload_path(base_dir, "photo.png")
    assert result == os.path.join(os.path.realpath(base_dir), "photo.png")


def test_rejects_parent_directory_traversal(base_dir):
    # basename() strips the leading "../" segments, collapsing this to
    # "etc/passwd" -> "passwd" inside base_dir, i.e. it does NOT escape.
    # Escape attempts are exercised via symlinks and absolute paths below.
    result = safe_upload_path(base_dir, "../../../etc/passwd")
    assert result == os.path.join(os.path.realpath(base_dir), "passwd")


def test_rejects_absolute_path(base_dir):
    result = safe_upload_path(base_dir, "/etc/passwd")
    assert result == os.path.join(os.path.realpath(base_dir), "passwd")


def test_rejects_dot(base_dir):
    with pytest.raises(ValueError):
        safe_upload_path(base_dir, ".")


def test_rejects_dotdot(base_dir):
    with pytest.raises(ValueError):
        safe_upload_path(base_dir, "..")


def test_rejects_empty_filename(base_dir):
    with pytest.raises(ValueError):
        safe_upload_path(base_dir, "")


def test_rejects_null_byte(base_dir):
    with pytest.raises(ValueError):
        safe_upload_path(base_dir, "evil\x00.png")


def test_rejects_non_string_filename(base_dir):
    with pytest.raises(ValueError):
        safe_upload_path(base_dir, None)


def test_windows_style_separators_are_stripped(base_dir):
    result = safe_upload_path(base_dir, "..\\..\\windows\\win.ini")
    assert result == os.path.join(os.path.realpath(base_dir), "win.ini")


def test_symlink_inside_base_dir_pointing_outside_is_rejected(tmp_path, base_dir):
    outside = tmp_path / "outside"
    outside.mkdir()
    secret = outside / "secret.txt"
    secret.write_text("top secret")

    # A symlink named "escape" living inside base_dir but resolving
    # outside of it. basename() alone can't catch this - the realpath
    # containment check does.
    link = os.path.join(base_dir, "escape")
    os.symlink(str(secret), link)

    with pytest.raises(ValueError):
        safe_upload_path(base_dir, "escape")
