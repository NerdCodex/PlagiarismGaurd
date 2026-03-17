import BarcodeScannerComponent from "react-qr-barcode-scanner";

function Scanner({ onScan, onClose }) {
  return (
    <div className="scanner-overlay">
      <div className="scanner-container">
        <div className="scanner-corner tl" />
        <div className="scanner-corner tr" />
        <div className="scanner-corner bl" />
        <div className="scanner-corner br" />
        <BarcodeScannerComponent
          width={340}
          height={340}
          onUpdate={(err, result) => {
            if (result) {
              onScan(result.text);
            }
          }}
        />
      </div>
      <button className="scanner-close-btn" onClick={onClose}>
        ✕ Cancel Scan
      </button>
    </div>
  );
}

export default Scanner;