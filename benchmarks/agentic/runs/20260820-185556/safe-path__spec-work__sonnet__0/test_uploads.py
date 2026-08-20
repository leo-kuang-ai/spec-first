import os
import tempfile
import unittest

from uploads import safe_upload_path


class TestSafeUploadPath(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.base_dir = self.tmp.name

    def tearDown(self):
        self.tmp.cleanup()

    def test_simple_filename_joins_within_base(self):
        result = safe_upload_path(self.base_dir, "photo.jpg")
        self.assertEqual(result, os.path.realpath(os.path.join(self.base_dir, "photo.jpg")))

    def test_rejects_parent_traversal(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "../etc/passwd")

    def test_rejects_nested_parent_traversal(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "a/../../etc/passwd")

    def test_rejects_absolute_path(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "/etc/passwd")

    def test_rejects_windows_style_absolute_path(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "C:\\Windows\\system.ini")

    def test_rejects_backslash_traversal(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "..\\..\\etc\\passwd")

    def test_rejects_embedded_subdirectory(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "sub/photo.jpg")

    def test_rejects_dot(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, ".")

    def test_rejects_dotdot(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "..")

    def test_rejects_empty_filename(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "")

    def test_rejects_null_byte(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "photo.jpg\x00.png")

    def test_rejects_symlink_escape(self):
        escape_target = tempfile.mkdtemp()
        try:
            link_path = os.path.join(self.base_dir, "escape")
            os.symlink(escape_target, link_path)
            with self.assertRaises(ValueError):
                safe_upload_path(self.base_dir, "escape")
        finally:
            os.rmdir(escape_target)


if __name__ == "__main__":
    unittest.main()
