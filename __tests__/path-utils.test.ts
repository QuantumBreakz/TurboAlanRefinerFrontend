import {
  getFilename,
  sanitizePathForDisplay,
  isSystemPath,
  formatFilePath,
} from "@/lib/path-utils";

describe("getFilename", () => {
  it("returns empty string for empty input", () => {
    expect(getFilename("")).toBe("");
  });

  it("extracts filename from a Unix path", () => {
    expect(getFilename("/tmp/uploads/document.docx")).toBe("document.docx");
  });

  it("extracts filename from a Windows path", () => {
    expect(getFilename("C:\\Users\\Ali\\AppData\\Local\\Temp\\file.pdf")).toBe(
      "file.pdf"
    );
  });

  it("returns the path unchanged when there are no separators", () => {
    expect(getFilename("report.pdf")).toBe("report.pdf");
  });

  it("handles a trailing slash gracefully", () => {
    // split('/').pop() on '/tmp/' gives '', fallback is the original path
    const result = getFilename("/tmp/");
    expect(typeof result).toBe("string");
  });
});

describe("sanitizePathForDisplay", () => {
  it("returns empty string for empty input", () => {
    expect(sanitizePathForDisplay("")).toBe("");
  });

  it("returns the value unchanged if it has no separators", () => {
    expect(sanitizePathForDisplay("myfile.docx")).toBe("myfile.docx");
  });

  it("strips a Unix system path to the filename", () => {
    expect(sanitizePathForDisplay("/home/ali/documents/essay.docx")).toBe(
      "essay.docx"
    );
  });

  it("strips a Windows temp path to the filename", () => {
    expect(
      sanitizePathForDisplay(
        "C:\\Users\\Ali\\AppData\\Local\\Temp\\upload.pdf"
      )
    ).toBe("upload.pdf");
  });

  it("renames a tmp-prefixed file to a clean uploaded_file name", () => {
    const result = sanitizePathForDisplay("/tmp/tmpXyZ123.docx");
    expect(result).toBe("uploaded_file.docx");
  });

  it("renames a file containing 'temp' to a clean uploaded_file name", () => {
    const result = sanitizePathForDisplay("/var/tmp/tempfile.pdf");
    expect(result).toBe("uploaded_file.pdf");
  });
});

describe("isSystemPath", () => {
  it("returns false for empty input", () => {
    expect(isSystemPath("")).toBe(false);
  });

  it("returns false for a plain filename", () => {
    expect(isSystemPath("document.docx")).toBe(false);
  });

  it("detects Windows drive paths", () => {
    expect(isSystemPath("C:\\Users\\Ali\\file.docx")).toBe(true);
    expect(isSystemPath("D:\\Projects\\report.pdf")).toBe(true);
  });

  it("detects Windows AppData Temp paths", () => {
    expect(isSystemPath("C:\\Users\\Ali\\AppData\\Local\\Temp\\file.txt")).toBe(
      true
    );
  });

  it("detects Unix /tmp paths", () => {
    expect(isSystemPath("/tmp/upload.docx")).toBe(true);
  });

  it("detects Unix /var/tmp paths", () => {
    expect(isSystemPath("/var/tmp/processing.pdf")).toBe(true);
  });

  it("returns false for a normal relative path", () => {
    expect(isSystemPath("uploads/document.pdf")).toBe(false);
  });
});

describe("formatFilePath", () => {
  it("returns the fallback for empty input", () => {
    expect(formatFilePath("")).toBe("file");
    expect(formatFilePath("", "document")).toBe("document");
  });

  it("sanitizes a system path to just the filename", () => {
    expect(formatFilePath("/tmp/tmpABCdef.docx")).toBe("uploaded_file.docx");
  });

  it("sanitizes a Windows drive path", () => {
    expect(
      formatFilePath("C:\\Users\\Ali\\Desktop\\thesis.pdf")
    ).toBe("thesis.pdf");
  });

  it("extracts a filename from an HTTP URL", () => {
    expect(
      formatFilePath("https://example.com/files/report%20final.pdf")
    ).toBe("report final.pdf");
  });

  it("returns 'Google Drive Document' for a Drive-style ID", () => {
    // A 28-char alphanumeric ID that matches the Google Drive pattern
    expect(formatFilePath("1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs")).toBe(
      "Google Drive Document"
    );
  });

  it("returns the filename for a plain filename with no separators", () => {
    expect(formatFilePath("my-essay.docx")).toBe("my-essay.docx");
  });
});
