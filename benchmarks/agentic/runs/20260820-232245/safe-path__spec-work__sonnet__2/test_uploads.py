import os

import pytest

from uploads import safe_upload_path


def test_joins_simple_filename(tmp_path):
    result = safe_upload_path(str(tmp_path), "report.pdf")
    assert result == os.path.join(str(tmp_path), "report.pdf")


@pytest.mark.parametrize(
    "filename",
    [
        "../secret.txt",
        "../../etc/passwd",
        "sub/dir/report.pdf",
        "/etc/passwd",
        "..\\..\\windows\\system32\\config",
    ],
)
def test_strips_path_components_and_stays_inside_base_dir(tmp_path, filename):
    base = str(tmp_path)
    result = safe_upload_path(base, filename)
    assert os.path.dirname(result) == os.path.normpath(base)
    assert os.path.commonpath([os.path.abspath(base), result]) == os.path.abspath(base)


@pytest.mark.parametrize("filename", ["", ".", "..", "///", "\\\\"])
def test_rejects_names_with_no_usable_basename(tmp_path, filename):
    with pytest.raises(ValueError):
        safe_upload_path(str(tmp_path), filename)
