import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { SnackbarProvider } from "notistack";
import { persistor, store } from "./redux/store";
import { Router } from "./routes/Router";

function App() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <SnackbarProvider maxSnack={3} autoHideDuration={2000}>
          <BrowserRouter>
            <Router />
          </BrowserRouter>
        </SnackbarProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
