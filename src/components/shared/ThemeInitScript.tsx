export function themeInitScript() {
  return `(function(){try{var s=localStorage.getItem("wt-theme");var d=s==="dark"||(s==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(s==="light")d=false;var r=document.documentElement;r.setAttribute("data-theme",d?"dark":"light");r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;
}
