class RedBatchTranslatorButton {
    private panel = <HTMLElement> document.getElementsByClassName("toolbar-content toolbar3")[0];
    private button : HTMLElement;
    private parent : RedBatchTranslator;

    constructor (parent : RedBatchTranslator) {
        this.parent = parent;

        // <button class="menu-button batch-translate" data-tranattr="title" title="Batch translation">
        //  <img src="img/translate_all.png" alt="translate">
        // </button>
        this.button = document.createElement("button");
        this.button.classList.add("menu-button", "batch-translate");
        this.button.title = "Red Batch Translation";
        this.button.style.filter = "hue-rotate(260deg)"; // Green to red
        this.button.title = "Red Batch Translation";

        let img = document.createElement("img");
        img.src = "img/translate_all.png";
        img.alt = "red batch translation";
        this.button.appendChild(img);
        this.panel.appendChild(this.button);

        this.button.addEventListener("click", () => {
            this.parent.open();
        });
    }
}