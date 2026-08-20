import os

import pytest

from uploads import safe_upload_path


def test_joins_plain_filename(tmp_path):
    result = safe_upload_path(str(tmp_path), "report.pdf")
    assert result == os.path.join(str(tmp_path), "report.pdf")


def test_strips_directory_components(tmp_path):
    result = safe_upload_path(str(tmp_path), "some/dir/report.pdf")
    assert result == os.path.join(str(tmp_path), "report.pdf")


@pytest.mark.parametrize(
    "filename",
    [
        "../secret.txt",
        "../../etc/passwd",
        "..\\..\\windows\\system32\\config",
        "..",
        ".",
        "",
    ],
)
def test_rejects_traversal_and_invalid_names(tmp_path, filename):
    with pytest.raises(ValueError):
        safe_upload_path(str(tmp_path), filename)


def test_rejects_null_byte(tmp_path):
    with pytest.raises(ValueError):
        safe_upload_path(str(tmp_path), "report.pdf\x00.exe")


def test_result_stays_within_base_dir(tmp_path):
    result = safe_upload_path(str(tmp_path), "nested/../../escape.txt")
    assert os.path.commonpath([str(tmp_path), result]) == str(tmp_path)
