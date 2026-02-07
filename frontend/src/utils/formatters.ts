export const formatRUT = (rut: string | undefined | null): string => {
    if (!rut) return '';

    // Clean the RUT (remove dots, hyphens, and whitespace)
    const cleanRut = rut.replace(/[^0-9kK]/g, '');

    if (cleanRut.length < 2) return rut;

    // Split into body and verifier digit
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();

    // Add dots to the body
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${formattedBody}-${dv}`;
};
