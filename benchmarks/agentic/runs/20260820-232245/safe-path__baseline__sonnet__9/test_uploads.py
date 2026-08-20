import os

import pytest

from uploads import safe_upload_path


def test_joins_plain_filename(tmp_path):
    result = safe_upload_path(str(tmp_path), "report.pdf")
    assert result == os.path.realpath(os.path.join(str(tmp_path), "report.pdf"))


def test_rejects_parent_traversal(tmp_path):
    with pytest.raises(ValueError):
        safe_upload_path(str(tmp_path), "../etc/passwd")


def test_rejects_nested_traversal(tmp_path):
    with pytest.raises(ValueError):
        safe_upload_path(str(tmp_path), "a/../../etc/passwd")


def test_rejects_absolute_path(tmp_path):
    with pytest.raises(ValueError):
        safe_upload_path(str(tmp_path), "/etc/passwd")


def test_rejects_embedded_separator(tmp_path):
    with pytest.raises(ValueError):
        safe_upload_path(str(tmp_path), "subdir/file.txt")


def test_rejects_empty_filename(tmp_path):
    with pytest.raises(ValueError):
        safe_upload_path(str(tmp_path), "")


def test_allows_dotfile(tmp_path):
    result = safe_upload_path(str(tmp_path), ".hidden")
    assert result == os.path.realpath(os.path.join(str(tmp_path), ".hidden"))


def test_symlinked_base_dir_still_confines(tmp_path):
    real_base = tmp_path / "real_base"
    real_base.mkdir()
    link_base = tmp_path / "link_base"
    link_base.symlink_to(real_base, target_is_directory=True)

    result = safe_upload_path(str(link_base), "file.txt")
    assert result == os.path.realpath(os.path.join(str(real_base), "file.txt"))
