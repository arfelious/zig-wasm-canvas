let interactiveCount = 0
let eventLoops = []
let createInputs = inputs=>{
    let elements = []
    inputs.forEach(input=>{
        switch(input.type){
            case "slider":{
                let slider = document.createElement('input')
                slider.classList.add('interactive-slider')
                slider.type='range'
                slider.min=input.min
                slider.max=input.max
                slider.value=input.value
                let label = document.createElement('label')
                label.classList.add('interactive-label')
                label.innerText=input.label
                label.htmlFor=input.id
                elements.push([slider,input,label])
                break
            }
            case "button":{
                let button = document.createElement('button')
                button.classList.add('interactive-button')
                button.innerText=input.label
                elements.push([button,input])
                
                break
            }
            case "text":{
                let text = document.createElement('input')
                text.classList.add('interactive-text')
                text.type='text'
                text.value=input.value
                let label = document.createElement('label')
                label.classList.add('interactive-label')
                label.innerText=input.label
                label.htmlFor=input.id
                elements.push([text,input,label])
                break
            }
        }
        let evName = input.type=='slider'?'input':input.type=='text'?'change':'click'
        if(input.onChange)elements[elements.length-1][0].addEventListener(evName,input.onChange)
        
    })

    return elements
}
let createInteractive = (parent=document.body,options,wasmOptions)=>{
    if(interactiveCount++==0){
        addEventLoop()
    }
    let res = []
    options = options||{}
    let container = document.createElement('div')
    container.classList.add('interactive-container')
    let canvasCount = options.canvasCount||1
    for(let i=0;i<canvasCount;i++){
        let canvas = document.createElement('canvas')
        canvas.classList.add('interactive-canvas')
        if(!options.nonSquare)canvas.width=canvas.height=options.size||360
        else {
            canvas.width=options.width||360
            canvas.height=options.height||360
        }
        let ctx = canvas.getContext('2d')
        ctx.fillStyle='black'
        ctx.fillRect(0,0,canvas.width,canvas.height)
        container.appendChild(canvas)
        res.push(canvas)
    }
    parent.appendChild(container)
    let state = {isPlaying:false}
    if(options.isWasm){
        wasmOptions.pageCount=wasmOptions.pageCount||2
        let memory = new WebAssembly.Memory({initial:wasmOptions.pageCount,maximum:wasmOptions.pageCount})
        let consoleLog = (arg)=>console.log(arg)
        let importObject = {env:{consoleLog,memory,...(wasmOptions.importObject||{})}}
        let url = wasmOptions.url
        WebAssembly.instantiateStreaming(fetch(url),importObject).then(r=>wasmOptions.onInstantiate(res,r.instance,memory,state,eventLoops))
    }else{
        options.onInstantiate(res,state,eventLoops)

    }
    let inputsContainer = document.createElement('div')
    inputsContainer.classList.add('interactive-input-container')
    let optionsButton = document.createElement('img')
    optionsButton.classList.add('interactive-options')
    optionsButton.src="/cog.png"
    container.appendChild(optionsButton)
    let playButton = document.createElement('button')
    playButton.classList.add('interactive-play-button')
    playButton.innerText='Play'
    playButton.onclick=()=>{
        state.isPlaying=!state.isPlaying
        playButton.innerText=state.isPlaying?'Pause':'Play'
    }
    container.appendChild(playButton)
    container.appendChild(inputsContainer)
    let element = document.querySelector('.interactive-input-container');
    let defaultInputsContainerHeight = window.getComputedStyle(element).getPropertyValue('max-height');
    optionsButton.onclick=()=>{
        console.log(inputsContainer.style.height)
        inputsContainer.style.height=inputsContainer.style.height==defaultInputsContainerHeight?'0px':defaultInputsContainerHeight
    }
    if(options.title){
        let title = document.createElement('div')
        title.classList.add('interactive-title')
        title.innerText=options.title
        container.appendChild(title)
    }
    options.inputs = options.inputs||[]
    let inputs = createInputs(options.inputs)
    options.inputElements = inputs
    for(let key in inputs){
        if(inputs[key][2]){
            inputsContainer.appendChild(inputs[key][2])
        }
        inputsContainer.appendChild(inputs[key][0])
    }
    return res
}
let addEventLoop = ()=>{
    let lastTime = Date.now()
    let loop = ()=>{
        let now = Date.now()
        let diff = now-lastTime
        lastTime=now
        eventLoops.forEach(e=>e(diff))
        requestAnimationFrame(loop)
    }
    loop()
}