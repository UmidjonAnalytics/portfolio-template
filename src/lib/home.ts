/**
 * Where the portfolio's home page lives. "/" on every customer site; on the orders deployment the
 * product page owns "/" (portfoliopro.uz) and the demo portfolio moves to NEXT_PUBLIC_HOME_PATH,
 * e.g. "/namuna".
 */
export const HOME = process.env.NEXT_PUBLIC_HOME_PATH || "/";

/** Link to the home page, or to one of its sections: "/#projects" or "/namuna#projects". */
export function homeHref(section?: string): string {
  if (!section) return HOME;
  return HOME === "/" ? `/#${section}` : `${HOME}#${section}`;
}
