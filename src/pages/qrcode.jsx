import React from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function QRCodeGenerator() {
  const url = "https://mokine.netlify.app";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center", // centre verticalement
        alignItems: "center",     // centre horizontalement
        height: "100vh",          // prend toute la hauteur de la page
        backgroundColor: "#F6F6FF"
      }}
    >
      <h2 style={{ marginBottom: 20 }}>
        Scannez ce QR code pour visiter le site
      </h2>
      <QRCodeCanvas
        value={url}
        size={400}
        bgColor="#ffffff"
        fgColor="#000000"
        level="H"
        includeMargin={true}
      />
    </div>
  );
}
