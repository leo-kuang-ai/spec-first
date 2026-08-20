import os
import unittest

from uploads import safe_upload_path


class SafeUploadPathTests(unittest.TestCase):
    def setUp(self):
        self.base_dir = os.path.abspath("/var/uploads")

    def test_joins_simple_filename(self):
        result = safe_upload_path(self.base_dir, "report.pdf")
        self.assertEqual(result, os.path.join(self.base_dir, "report.pdf"))

    def test_strips_parent_traversal(self):
        result = safe_upload_path(self.base_dir, "../../etc/passwd")
        self.assertEqual(result, os.path.join(self.base_dir, "passwd"))

    def test_strips_absolute_path(self):
        result = safe_upload_path(self.base_dir, "/etc/passwd")
        self.assertEqual(result, os.path.join(self.base_dir, "passwd"))

    def test_strips_embedded_directory_components(self):
        result = safe_upload_path(self.base_dir, "sub/dir/evil.sh")
        self.assertEqual(result, os.path.join(self.base_dir, "evil.sh"))

    def test_rejects_empty_basename(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "../")

    def test_rejects_dot_filename(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, ".")

    def test_rejects_dotdot_filename(self):
        with self.assertRaises(ValueError):
            safe_upload_path(self.base_dir, "..")

    def test_result_stays_within_base_dir(self):
        result = safe_upload_path(self.base_dir, "..%2f..%2fetc%2fpasswd")
        self.assertTrue(result.startswith(self.base_dir + os.sep))


if __name__ == "__main__":
    unittest.main()
