import React from "react";
import { createRoot } from "react-dom/client";

import HomeApp from "./HomeApp.jsx";
import "../../../webapp/main/static/main/css/pages/home.css";

const rootElement = document.getElementById("home-app");
const propsElement = document.getElementById("home-app-props");

if (rootElement) {
    const initialProps = propsElement ? JSON.parse(propsElement.textContent) : {};
    const root = createRoot(rootElement);

    root.render(
        <React.StrictMode>
            <HomeApp {...initialProps} />
        </React.StrictMode>,
    );
}
