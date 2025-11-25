# ✅ Fixed: Missing Icons in CustomAlert

## 🐛 **The Issue:**
The `CustomAlert` component was trying to use `Icons.XCircle` and `Icons.AlertTriangle`, but these icons were not exported from the `components/ui/Icons.tsx` file. This caused 2 runtime errors (or build errors) when trying to display "Error" or "Warning" alerts.

## 🛠️ **The Fix:**
I updated `components/ui/Icons.tsx` to:
1.  Import `XCircle` and `AlertTriangle` from `lucide-react`.
2.  Export them in the `Icons` object.

## 🚀 **Result:**
- **Error Alerts**: Now correctly show the red X circle icon.
- **Warning Alerts**: Now correctly show the yellow triangle icon.
- **No more crashes** when triggering these alerts.

**Your custom alerts are now fully functional!** ✨
