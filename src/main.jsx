import ReactDOM from "react-dom/client";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if (screen.orientation?.lock) {
  screen.orientation.lock("landscape").catch(() => {});
}
