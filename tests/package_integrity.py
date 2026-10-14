"""Verify the downloadable delivery ZIP before publishing it to GitHub.

Uses Python's standard library; run: python tests/package_integrity.py
Validates CRCs, runtime entry points, source consistency and excluded local data.
"""
from pathlib import Path
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / 'artifacts/campus-all-code.zip'
PREFIX = 'campus-miniapp/'

class DeliveryPackageTest(unittest.TestCase):
    def test_archive_integrity_and_runtime_files(self):
        with zipfile.ZipFile(ARCHIVE) as archive:
            self.assertIsNone(archive.testzip())
            for filename in ['index.html', 'package.json', 'package-lock.json',
                             'src/pages.json', 'src/manifest.json',
                             'dist/build/h5/index.html',
                             'dist/build/mp-weixin/app.json']:
                self.assertIn(PREFIX + filename, archive.namelist())
            for filename in archive.namelist():
                parts = Path(filename).parts
                self.assertFalse(any(part in ['.env', '.data', '.git', 'node_modules'] for part in parts))

    def test_all_source_files_match_working_tree(self):
        with zipfile.ZipFile(ARCHIVE) as archive:
            for directory in ['src', 'server', 'scripts', 'tests', 'docs']:
                for path in (ROOT / directory).rglob('*'):
                    if path.is_file() and '__pycache__' not in path.parts:
                        name = PREFIX + str(path.relative_to(ROOT))
                        self.assertEqual(archive.read(name), path.read_bytes(), name)

if __name__ == '__main__':
    unittest.main()
