import os
import tempfile
import unittest

from uploads import safe_upload_path


class SafeUploadPathTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.base_dir = self.tmp.name

    def tearDown(self):
        self.tmp.cleanup()

    def test_joins_simple_filename(self):
        result = safe_upload_path(self.base_dir, "report.pdf")
        self.assertEqual(result, os.path.join(os.path.realpath(self.base_dir), "report.pdf"))

    def test_rejects_parent_traversal(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "../../etc/passwd")

    def test_rejects_nested_traversal(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "subdir/../../secret")

    def test_rejects_absolute_path(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "/etc/passwd")

    def test_rejects_embedded_separator(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "subdir/file.txt")

    def test_rejects_bare_dot_dot(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "..")

    def test_rejects_empty_filename(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "")

    def test_symlink_escape_is_rejected(self):
        outside = tempfile.TemporaryDirectory()
        try:
            link_path = os.path.join(self.base_dir, "escape")
            os.symlink(outside.name, link_path)
            with self.assertRaises(ValueError):
                safe_upload_path(self.base_dir, "escape/secret.txt")
        finally:
            outside.cleanup()


if __name__ == "__main__":
    unittest.main()
