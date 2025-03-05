export class Title {
    private title: HTMLDivElement
    private discoverButton: HTMLAnchorElement

    constructor() {
        this.createTitle()
        this.createDiscoverButton()
    }

    private createTitle(): void {
        const title = document.createElement('div')
        title.style.position = 'absolute'
        title.style.top = '100px'
        title.style.left = '50%'
        title.style.transform = 'translateX(-50%)'
        title.style.color = 'black'
        title.style.fontSize = '24px'
        title.style.fontFamily = "'Roboto', sans-serif"
        title.style.pointerEvents = 'none'
        title.style.opacity = '0'
        title.style.transition = 'opacity 0.5s ease-in-out'
        title.innerText = 'BMW M5 Touring'
        document.body.appendChild(title)
        this.title = title
    }

    private createDiscoverButton(): void {
        const discoverButton = document.createElement('a')
        discoverButton.style.position = 'absolute'
        discoverButton.style.top = '150px'
        discoverButton.style.left = '50%'
        discoverButton.style.transform = 'translateX(-50%)'
        discoverButton.style.color = 'black'
        discoverButton.style.fontSize = '18px'
        discoverButton.style.fontFamily = "'Roboto', sans-serif"
        discoverButton.style.textDecoration = 'none'
        discoverButton.style.cursor = 'pointer'
        discoverButton.style.border = '1px solid black'
        discoverButton.style.borderRadius = '10px'
        discoverButton.style.padding = '10px'
        discoverButton.style.opacity = '0'
        discoverButton.style.transition = 'opacity 0.5s ease-in-out'
        discoverButton.innerText = 'Découvrir'
        discoverButton.href = '#'
        discoverButton.addEventListener('click', (event) => {
            event.preventDefault()
            console.log('Bouton Découvrir cliqué')
        })
        document.body.appendChild(discoverButton)
        this.discoverButton = discoverButton
    }

    public show(): void {
        this.title.style.opacity = '1'
        this.discoverButton.style.opacity = '1'
    }

    public hide(): void {
        this.title.style.opacity = '0'
        this.discoverButton.style.opacity = '0'
    }
}
