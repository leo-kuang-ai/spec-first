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

    def test_simple_filename_joins_under_base_dir(self):
        path = safe_upload_path(self.base_dir, "photo.png")
        self.assertEqual(path, os.path.join(os.path.realpath(self.base_dir), "photo.png"))

    def test_nested_relative_filename_stays_under_base_dir(self):
        path = safe_upload_path(self.base_dir, "sub/photo.png")
        self.assertTrue(path.startswith(os.path.realpath(self.base_dir)))

    def test_parent_traversal_is_rejected(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "../../etc/passwd")

    def test_leading_parent_traversal_mixed_with_subdir_is_rejected(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "sub/../../escape.txt")

    def test_absolute_path_is_rejected(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "/etc/passwd")

    def test_absolute_path_outside_base_dir_via_drive_style_is_rejected(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "//etc/passwd")

    def test_symlink_escape_is_rejected(self):
        outside_dir = tempfile.TemporaryDirectory()
        try:
            target = os.path.join(outside_dir.name, "secret.txt")
            with open(target, "w") as f:
                f.write("secret")

            link_path = os.path.join(self.base_dir, "link")
            os.symlink(outside_dir.name, link_path)

            with self.assertRaises(ValueError):
                safe_upload_path(self.base_dir, "link/secret.txt")
        finally:
            outside_dir.cleanup()

    def test_filename_equal_to_base_dir_name_is_allowed(self):
        base_name = os.path.basename(os.path.realpath(self.base_dir))
        path = safe_upload_path(self.base_dir, base_name)
        self.assertTrue(path.startswith(os.path.realpath(self.base_dir)))


if __name__ == "__main__":
    unittest.main()
