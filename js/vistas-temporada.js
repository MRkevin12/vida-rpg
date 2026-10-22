// vistas-temporada.js — Las temporadas mensuales (v149): la tarjeta de Hoy y la ventana para elegir las metas.
//
// Parte de vistas.js. Como todas las vistas: recibe datos y devuelve un texto con HTML; no cambia la partida.
// Las reglas (qué metas hay, cómo se mide el avance, el premio) están en temporadas.js.

import * as temporadas from "./temporadas.js";
import { fechaLegible } from "./fechas.js";
import { barra } from "./vistas-comun.js";

const textoPremio = (p) => [p.xp ? `+${p.xp} XP` : "", p.gemas ? `+${p.gemas} 💎` : "", p.monedas ? `+${p.monedas} 🪙` : ""].filter(Boolean).join(" · ");
const DIAS_PLURAL = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábados", "domingos"];
const numero = (n) => String(n).replace(".", ",");

// En Hoy: primero el resumen de una temporada que acaba de cerrar (hasta que lo cierres), si no el avance de este
// mes y, si todavía no elegiste metas, una invitación.
export function tarjetaTemporada(estado, ctx) {
    const sinVer = Object.keys(estado.temporadas).sort().reverse()
        .find((mes) => estado.temporadas[mes].cierre && !estado.temporadas[mes].cierre.visto);
    if (sinVer) return tarjetaCierre(estado, ctx, sinVer);

    const mes = temporadas.mesDe(ctx.hoy);
    const t = temporadas.temporadaDe(estado, mes, ctx.hoy);
    if (!t) {
        return `
        <section class="panel temporada" aria-label="Temporada del mes">
            <p class="etiqueta">🗓️ Temporada de ${temporadas.nombreDelMes(mes)}</p>
            <p class="nota">Elige hasta ${temporadas.MAX_METAS} metas para este mes. Si las cumples ganas una recompensa, y al final te cuento cómo te fue.</p>
            <button type="button" class="boton boton-secundario boton-ancho" data-accion="abrir" data-dialogo="temporada">Elegir mis metas del mes</button>
        </section>`;
    }
    const filas = t.metas.map((m) => `
            <li class="temporada-meta ${m.cumplida ? "cumplida" : ""}">
                <span>${m.cumplida ? "✅" : m.icono} ${m.nombre}</span>
                <b>${numero(m.valor)} / ${numero(m.meta)} <small>${m.unidad}</small></b>
                ${barra(m.pct, m.cumplida ? "barra-lograda" : "")}
                ${!m.cumplida && !m.alRitmo && t.diasRestantes > 0 ? `<small class="texto-suave">Vas un poco atrasado para el ritmo del mes.</small>` : ""}
            </li>`).join("");
    return `
        <section class="panel temporada" aria-label="Temporada del mes">
            <p class="etiqueta">🗓️ Temporada de ${temporadas.nombreDelMes(mes)} · ${t.diasRestantes ? `quedan ${t.diasRestantes} días` : "último día"}</p>
            <ul class="temporada-lista">${filas}</ul>
            <p class="mini texto-suave">Cada meta cumplida: ${textoPremio(temporadas.PREMIO_META)}. Si cumples todas: ${textoPremio(temporadas.PREMIO_TODAS)} más.</p>
            <button type="button" class="boton boton-secundario boton-ancho" data-accion="abrir" data-dialogo="temporada">Cambiar mis metas</button>
        </section>`;
}

// «Así te fue en septiembre»: el resumen de una temporada ya cerrada.
function tarjetaCierre(estado, ctx, mes) {
    const c = estado.temporadas[mes].cierre;
    const n = c.numeros;
    const filas = c.valores.map((v) => {
        const info = temporadas.METAS[v.tipo];
        return `<li class="temporada-meta ${v.valor >= v.meta ? "cumplida" : ""}">
                <span>${v.valor >= v.meta ? "✅" : "▫️"} ${info.nombre}</span>
                <b>${numero(v.valor)} / ${numero(v.meta)} <small>${info.unidad}</small></b></li>`;
    }).join("");
    // Contra el mes de antes (si ese mes tuvo misiones).
    const antes = temporadas.numerosDelMes(estado, temporadas.mesAnterior(mes), ctx.hoy).misiones;
    const comparacion = antes > 0 && n.misiones !== antes
        ? `${n.misiones > antes ? "📈 " + (n.misiones - antes) + " más" : "📉 " + (antes - n.misiones) + " menos"} misiones que el mes anterior.` : "";
    const consejo = temporadas.consejoParaLaSiguiente(c);
    const datos = [
        `${n.misiones} misiones y ${n.xp} XP este mes`,
        n.perfectos ? `${n.perfectos} ${n.perfectos === 1 ? "día perfecto" : "días perfectos"}` : "",
        n.mejorDia ? `Tu mejor día fue el ${fechaLegible(n.mejorDia.fecha)} (${n.mejorDia.misiones} ${n.mejorDia.misiones === 1 ? "misión" : "misiones"})` : "",
        n.mejorDiaSemana !== null ? `Tu día más fuerte: los ${DIAS_PLURAL[n.mejorDiaSemana]}` : "",
        comparacion,
    ].filter(Boolean);
    return `
        <section class="panel temporada temporada-cierre" aria-label="Resumen de la temporada">
            <p class="etiqueta">🗓️ Así te fue en ${temporadas.nombreDelMes(mes)} · ${c.cumplidas} de ${c.total} metas</p>
            <p>${temporadas.veredicto(c)}</p>
            <ul class="temporada-lista">${filas}</ul>
            ${c.premio.xp ? `<p class="mini"><strong>Recompensa: ${textoPremio(c.premio)}</strong></p>` : ""}
            <ul class="semana-lista">${datos.map((d) => `<li>${d}</li>`).join("")}</ul>
            ${consejo ? `<p class="nota">💡 ${consejo}</p>` : ""}
            <button type="button" class="boton boton-secundario boton-ancho" data-accion="abrir" data-dialogo="temporada">Elegir las metas de ${temporadas.nombreDelMes(temporadas.mesDe(ctx.hoy))}</button>
            <button type="button" class="boton boton-principal boton-ancho" data-accion="cerrar-temporada" data-mes="${mes}">Cerrar resumen</button>
        </section>`;
}

// La ventana «Metas del mes»: un número por cada tipo de meta; lo que dejas vacío no cuenta.
// Se rellenan las que ya tenías (o las sugeridas la primera vez).
export function contenidoTemporada(estado, hoy) {
    const mes = temporadas.mesDe(hoy);
    const guardada = estado.temporadas[mes];
    const actuales = Object.fromEntries((guardada ? guardada.metas : []).map((m) => [m.tipo, m.meta]));
    const sugeridos = new Set(temporadas.tiposSugeridos(estado));
    const campos = Object.entries(temporadas.METAS).map(([tipo, info]) => {
        const sugerida = temporadas.metaSugerida(estado, tipo, mes, hoy);
        const valor = guardada ? actuales[tipo] : sugeridos.has(tipo) ? sugerida : "";
        return `
        <label>${info.icono} ${info.nombre} <span class="texto-suave">(${info.unidad})</span>
            <input type="number" inputmode="decimal" name="meta_${tipo}" min="1" step="any" value="${valor ?? ""}" placeholder="Sin meta · sugerida ${numero(sugerida)}">
        </label>`;
    }).join("");
    return `
        <h2 class="titulo-juego" tabindex="-1" autofocus>🗓️ Metas de ${temporadas.nombreDelMes(mes)}</h2>
        <p class="nota">Elige hasta ${temporadas.MAX_METAS}: deja vacías las que no quieras. Las sugeridas salen de cómo te fue el mes pasado, un poquito más exigentes.</p>
        ${campos}
        <p class="nota">Por cada meta cumplida: ${textoPremio(temporadas.PREMIO_META)}. Si cumples todas: ${textoPremio(temporadas.PREMIO_TODAS)} más.
           Se cierran el 1.º del mes que viene.</p>
        <div class="botones-dialogo">
            <button type="button" class="boton boton-secundario" data-accion="cerrar">Cancelar</button>
            <button type="submit" class="boton boton-principal">Guardar metas</button>
        </div>`;
}
