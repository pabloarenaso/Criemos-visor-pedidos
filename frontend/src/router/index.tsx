import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import Layout from '../components/Layout';
import Dashboard from '../pages/Dashboard';
import Pedidos from '../pages/Pedidos';
import PedidoDetalle from '../pages/PedidoDetalle';
import Productos from '../pages/Productos';
import PreparacionEnvio from '../pages/PreparacionEnvio';
import ImpresionEtiquetas from '../pages/ImpresionEtiquetas';
import Clientes from '../pages/Clientes';

// Route definitions
export const routes: RouteObject[] = [
    {
        path: '/',
        element: <Layout />,
        children: [
            { index: true, element: <Dashboard /> },
            { path: 'dashboard', element: <Dashboard /> },
            { path: 'pedidos', element: <Pedidos /> },
            { path: 'pedidos/:orderId', element: <PedidoDetalle /> },
            { path: 'preparar-envio', element: <PreparacionEnvio /> },
            { path: 'impresion-etiquetas', element: <ImpresionEtiquetas /> },
            { path: 'productos', element: <Productos /> },
            { path: 'clientes', element: <Clientes /> },
        ],
    },
];

// Create and export the router instance
export const router = createBrowserRouter(routes);

export default router;
