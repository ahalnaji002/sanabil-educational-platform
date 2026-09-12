import { describe, expect, it } from "vitest";
import { getGradeLabel } from "./admin-grade";

describe("getGradeLabel", () => {
  it("maps every API grade to its Arabic label", () => {
    expect(getGradeLabel("TENTH")).toBe("عاشر");
    expect(getGradeLabel("ELEVENTH")).toBe("حادي عشر");
    expect(getGradeLabel("TAWJIHI")).toBe("توجيهي");
  });
});
