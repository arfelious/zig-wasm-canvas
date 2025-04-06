let interactiveCount = 0
let eventLoops = []
let createInputs = (inputs,canvasArr)=>{
    let elements = []
    let isClicked = false
    let canvas = canvasArr[0]
    let touchListeners = []
    let touchMoveFun = (input,evt)=>{
        var rect = canvas.getBoundingClientRect();
        let coords = {
            x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.offsetWidth,
            y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.offsetHeight
        }
        input.onChange(coords,isClicked,evt.type)
    }
    canvas.addEventListener('pointerdown',evt=>{
        isClicked = true
        touchListeners.forEach(e=>touchMoveFun(e,evt))
    })
    canvas.addEventListener('pointerup',evt=>{
        isClicked = false
        touchListeners.forEach(e=>touchMoveFun(e,evt))
    })
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
            case "touch-end":
            case "touch-move":{
                canvasArr[0].style.touchAction = 'none'
                canvasArr[0].style.cursor = 'pointer'
                elements.push([canvasArr[0],input])
            }
        }
        let evName = input.type=='slider'?'input':input.type=='text'?'change':input.type=="touch-move"?'pointermove'
        :input.type=="touch-end"?'pointerup':'click'
        let isTouch = input.type=="touch-move"||input.type=="touch-end"
        if(isTouch){
            touchListeners.push(input)
        }
        if(input.onChange)elements[elements.length-1][0].addEventListener(evName,(...args)=>{
            if(isTouch){
                let evt = args[0]
                touchMoveFun(input,evt)
            }else{
                input.onChange(...args)
            }
        })
        
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
        inputsContainer.style.height=inputsContainer.style.height==defaultInputsContainerHeight?'0px':defaultInputsContainerHeight
    }
    if(options.title){
        let title = document.createElement('div')
        title.classList.add('interactive-title')
        title.innerText=options.title
        container.appendChild(title)
    }
    options.inputs = options.inputs||[]
    let inputs = createInputs(options.inputs,res)
    options.inputElements = inputs
    for(let key in inputs){
        if(inputs[key][2]){
            inputsContainer.appendChild(inputs[key][2])
        }
        if(!res.includes(inputs[key][0])){
            inputsContainer.appendChild(inputs[key][0])
        }
    }
    return res
}
let toArr = str=>str.match(/[0-9a-f]{1,2}/gi).map(val=>parseInt(val,16))
let toNum = (arr)=>arr[0]+arr[1]*256+arr[2]*256*256
let toStr = arr=>"#"+arr.map(val=>val.toString(16).padStart(2,"0")).join("")
let resetCanvas = (wasmCanvas,inputValues,context,canvas,options)=>{
    if(wasmCanvas.memory){
        if(!options.noClearMemory)wasmCanvas.memory.fill(0)
        context.clearRect(0,0,canvas.width,canvas.height)
        if(!options.noRedraw){
            context.fillStyle = "#000000"
            context.fillRect(0,0,canvas.width,canvas.height)
        }
    }
    if(typeof options.inputElements!==undefined){
        options.inputElements.forEach(([element,input])=>{
            if(input.type=="slider"){
                inputValues[input.id] = element.value
            }
            if(input.type=="text"){
                inputValues[input.id] = element.value
                if(input.id=="color"){
                    let val = element.value
                    if(element.value.length==4){
                        let c = element.value.slice(1)
                        val = "#"+c[0]+c[0]+c[1]+c[1]+c[2]+c[2]
                    }
                    if(val.length!=7||val[0]!="#"){
                        let curr = options.defaults?.[inputs[i].name]||options.DEFAULT_COLOR
                        element.value = val = curr
                    }
                    inputValues[input.name??"color"] = toNum(toArr(val))
                }
            }
        })
    }
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