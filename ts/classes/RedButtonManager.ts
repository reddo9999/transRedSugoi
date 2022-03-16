declare function t (text : string) : string;

class RedButtonManagerButton {
    public name : string;
    public icon : string;
    public title : string;
    public action : () => void | Promise<void>;
    private element : HTMLButtonElement | undefined;

    constructor (name : string, icon : string, title : string, action : () => void | Promise<void>) {
        this.name = name;
        this.icon = icon;
        this.title = title;
        this.action = action;
    }

    public setIcon (icon : string) {
        this.icon = icon;
        if (this.element != undefined) {
            this.element.children[0].className = icon;
        }
    }

    public getButton () {
        if (this.element != undefined) {
            return this.element;
        } else {
            let button = document.createElement("button");
            button.classList.add("menu-button");
            button.dataset.tranattr = "title";
            button.title = t(this.title);
            
            let icon = document.createElement("i");
            icon.classList.add(this.icon);
            button.appendChild(icon);

            icon.style.color = "#E00";

            button.addEventListener("click", this.action);
            this.element = button;
            return button;
        }
    }
}
/* 
class RedButtonManager {
    private static buttons : Array<RedButtonManagerButton> = [];

    public static addButton (name : string, icon : string, title : string, action : () => void | Promise<void>) {
        this.buttons.push(new RedButtonManagerButton(name, icon, title, action));
    }

    public static getButtons () {
        let buttons : Array<HTMLButtonElement> = [];
        RedButtonManager.buttons.forEach((buttonInfo) => {
            let button = document.createElement("button");
            button.classList.add("menu-button");
            button.dataset.tranattr = "title";
            button.title = t(buttonInfo.title);
            button.classList.add(buttonInfo.icon);

            button.addEventListener("click", buttonInfo.action);
        });
        return buttons;
    }
} */