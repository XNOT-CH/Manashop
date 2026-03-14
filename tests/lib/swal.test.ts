import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSwal = vi.hoisted(() => ({
  mixin: vi.fn().mockReturnThis(),
  fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  showLoading: vi.fn(),
  close: vi.fn(),
  stopTimer: vi.fn(),
  resumeTimer: vi.fn(),
}));

vi.mock("sweetalert2", () => ({
  default: mockSwal
}));

describe("lib/swal", () => {
  let swalModule: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSwal.fire.mockResolvedValue({ isConfirmed: true });
    swalModule = await import("@/lib/swal");
  });

  it("exports various alert functions", () => {
    expect(typeof swalModule.showSuccess).toBe("function");
    expect(typeof swalModule.showError).toBe("function");
    expect(typeof swalModule.showWarning).toBe("function");
    expect(typeof swalModule.showInfo).toBe("function");
    expect(typeof swalModule.showConfirm).toBe("function");
    expect(typeof swalModule.showDeleteConfirm).toBe("function");
    expect(typeof swalModule.showPurchaseConfirm).toBe("function");
    expect(typeof swalModule.showLoading).toBe("function");
    expect(typeof swalModule.hideLoading).toBe("function");
  });

  describe("toast functions", () => {
    it("showSuccess calls fire with success icon", () => {
      swalModule.showSuccess("Success message");
      expect(mockSwal.fire).toHaveBeenCalledWith(expect.objectContaining({
        icon: "success",
        title: "Success message"
      }));
    });

    it("showError calls fire with error icon", () => {
      swalModule.showError("Error message");
      expect(mockSwal.fire).toHaveBeenCalledWith(expect.objectContaining({
        icon: "error",
        title: "Error message"
      }));
    });
    
    it("showWarning calls fire with warning icon", () => {
      swalModule.showWarning("Warning message");
      expect(mockSwal.fire).toHaveBeenCalledWith(expect.objectContaining({
        icon: "warning",
        title: "Warning message"
      }));
    });
    
    it("showInfo calls fire with info icon", () => {
      swalModule.showInfo("Info message");
      expect(mockSwal.fire).toHaveBeenCalledWith(expect.objectContaining({
        icon: "info",
        title: "Info message"
      }));
    });
  });

  describe("confirm dialogs", () => {
    it("showConfirm shows warning dialog and returns boolean", async () => {
      const result = await swalModule.showConfirm("Title", "Are you sure?");
      
      expect(mockSwal.fire).toHaveBeenCalledWith(expect.objectContaining({
        title: "Title",
        text: "Are you sure?",
        icon: "warning",
        showCancelButton: true
      }));
      expect(result).toBe(true);
    });

    it("showDeleteConfirm shows delete dialog with item name", async () => {
      await swalModule.showDeleteConfirm("My Item");
      
      expect(mockSwal.fire).toHaveBeenCalledWith(expect.objectContaining({
        title: "ยืนยันการลบ?",
        html: expect.stringContaining("My Item"),
        confirmButtonColor: "#ef4444"
      }));
    });
  });

  describe("purchase dialogs", () => {
    it("showPurchaseConfirm displays accurate HTML", async () => {
      await swalModule.showPurchaseConfirm({
        productName: "Game",
        priceText: "99 THB"
      });
      
      expect(mockSwal.fire).toHaveBeenCalledWith(expect.objectContaining({
        html: expect.stringContaining("Game"),
      }));
      // Check that price is also in the html
      expect(mockSwal.fire).toHaveBeenCalledWith(expect.objectContaining({
        html: expect.stringContaining("99 THB"),
      }));
    });

    it("showPurchaseSuccessModal displays success view", () => {
      swalModule.showPurchaseSuccessModal({ productName: "Game" });
      
      expect(mockSwal.fire).toHaveBeenCalledWith(expect.objectContaining({
        icon: "success",
        html: expect.stringContaining("Game")
      }));
    });
  });

  describe("loading indicators", () => {
    it("showLoading calls SweetAlert loading", () => {
      swalModule.showLoading("Loading...");
      expect(mockSwal.fire).toHaveBeenCalledWith(expect.objectContaining({
        title: "Loading...",
        allowOutsideClick: false
      }));
      
      // Simulate didOpen
      const fireArgs = mockSwal.fire.mock.calls[0][0];
      fireArgs.didOpen();
      
      expect(mockSwal.showLoading).toHaveBeenCalled();
    });

    it("hideLoading calls Swal close", () => {
      swalModule.hideLoading();
      expect(mockSwal.close).toHaveBeenCalled();
    });
  });
});
