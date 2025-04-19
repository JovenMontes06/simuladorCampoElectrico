// utils.js

// Constante de Coulomb
const K = 9e9;

/**
 * Calcula la distancia entre dos puntos
 */
function getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcula el ángulo (en radianes) entre dos puntos con respecto al eje X
 */
function getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1); // y primero porque atan2 es (y, x)
}

/**
 * Calcula el campo eléctrico (E) debido a una carga en un punto (x0, y0)
 */
function calcularCampoDeCarga(carga, x0, y0) {
    const dx = carga.x - x0;
    const dy = carga.y - y0;
    const r = Math.sqrt(dx * dx + dy * dy);
    console.log(r);
    if (r === 0) return { Ex: 0, Ey: 0, E: 0, angle: 0 }; // Evita división por 0

    const E = (K * Math.abs(carga.q)) / (r * r);
    const angle = Math.atan2(dy, dx);

    // Dirección del campo: 
    // - Si la carga es positiva, el campo sale de la carga.
    // - Si la carga es negativa, el campo entra hacia la carga.
    const direccion = carga.q > 0 ? -1 : 1;


    const Ex = direccion * E * Math.cos(angle);
    const Ey = direccion * E * Math.sin(angle);

    return { Ex, Ey, E, angle };
}

/**
 * Suma todas las contribuciones del campo eléctrico en un punto (x0, y0)
 * debido a un array de cargas (excepto la de prueba)
 */
function calcularCampoTotal(cargas, x0, y0) {
    let totalEx = 0;
    let totalEy = 0;

    for (const carga of cargas) {
        // Ignorar la carga de prueba
        if (carga.tipo === 'prueba') continue;

        const { Ex, Ey } = calcularCampoDeCarga(carga, x0, y0);
        totalEx += Ex;
        totalEy += Ey;
    }

    const magnitud = Math.sqrt(totalEx * totalEx + totalEy * totalEy);
    const angulo = Math.atan2(totalEy, totalEx);

    return {
        Ex: totalEx,
        Ey: totalEy,
        magnitud,
        angulo
    };
}

/**
 * Devuelve el vector resultante a partir de un punto base (x0, y0) con longitud proporcional
 */
function getVectorDesdePunto(x0, y0, magnitud, angulo, escala = 1) {
    const x1 = x0 + Math.cos(angulo) * magnitud * escala;
    const y1 = y0 + Math.sin(angulo) * magnitud * escala;
    return {
        x0,
        y0,
        x1,
        y1,
        angulo,
        magnitud
    };
}
