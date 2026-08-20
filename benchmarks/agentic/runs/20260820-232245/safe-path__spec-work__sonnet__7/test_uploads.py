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

    def test_simple_filename(self):
        path = safe_upload_path(self.base_dir, "report.pdf")
        self.assertEqual(path, os.path.join(os.path.abspath(self.base_dir), "report.pdf"))

    def test_rejects_parent_traversal(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "../../etc/passwd")

    def test_rejects_nested_traversal_segment(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "subdir/../../secret.txt")

    def test_rejects_absolute_path(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "/etc/passwd")

    def test_rejects_empty_filename(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "")

    def test_rejects_dot_and_dotdot(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, ".")
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "..")

    def test_strips_directory_components(self):
        path = safe_upload_path(self.base_dir, "some/dir/file.txt")
        self.assertEqual(path, os.path.join(os.path.abspath(self.base_dir), "file.txt"))


if __name__ == "__main__":
    unittest.main()
