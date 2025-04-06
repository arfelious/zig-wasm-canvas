let gameOfLife = {create:function(){
    const DEFAULT_COLOR_NUM = 0x0099ff
    const DEFAULT_COLOR = "#ff9900"
    const CANVAS_WIDTH = 360
    const CANVAS_HEIGHT = 360
    let noop = ()=>{}
    let options = {}
    options.onInstantiate = noop
    options.DEFAULT_COLOR = DEFAULT_COLOR
    let inputValues = {"iterationCount":30,"size":120,"filledRatio":20,"color":DEFAULT_COLOR_NUM}
    let defaultValues = {...inputValues}
    let restartAnimation = ()=>{
        resetCanvas(wasmCanvas,inputValues,context,canvas,options)
        setColor()
        fillRandom()
    }
    let activateCell = noop
    let fillRandom = noop
    options.inputs=[{
        type:"slider",
        scale:"log",
        min:1,
        max:750,
        value:30,
        label:"Iteration Count",
        id:"iterationCount",
        onChange:(ev)=>{
            inputValues.iterationCount = ev.target.value
        }
    },
    {
        type:"slider",
        scale:"normal",
        min:1,
        max:100,
        value:20,
        label:"Filled Ratio",
        id:"filledRatio"
    },
    {
        type:"slider",
        scale:"normal",
        min:1,
        max:250,
        value:120,
        label:"Size",
        id:"size"
    },
    {
        type:"text",
        value:DEFAULT_COLOR,
        label:"Color",
        id:"color"
    },{
        type:"button",
        label:"Restart",
        id:"restart",
        onChange:restartAnimation
    
    },{
        type:"button",
        label:"Reset",
        id:"reset",
        onChange:(val)=>{
            options.inputElements.forEach(([element,input])=>{
                element.value = defaultValues[input.id]
            })
            inputValues = {...defaultValues}
            restartAnimation()
        }
    },{
        type:"touch-move",
        label:null,
        id:"touch",
        onChange:(coords,isClicked)=>{
            let {x,y} = coords
            x/=CANVAS_WIDTH
            y/=CANVAS_HEIGHT
            let i = Math.floor(x*inputValues.size)
            let j = Math.floor(y*inputValues.size)
            let index = (i+j*inputValues.size)*4
            if(isClicked){
                activateCell(index)
                placeImage()
            }
        }
    }
    ]
    options.isWasm=true
    options.canvasCount = 1
    options.title="Game of Life"
    let wasmOptions = {}
    wasmOptions.pageCount = 64
    wasmOptions.url="/interactive/zig/game_of_life/zig-out/bin/interactive.wasm"
    wasmOptions.importObject = {jsRand:(max,limit)=>limit?Math.floor(Math.random()*(max-2))+1:Math.floor(Math.random()*max)}
    let wasmCanvas = {memory:null,offset:null}
    let canvas=null,context = null
    let counter = 0
    let placeImage = noop
    let setColor = noop
    wasmOptions.onInstantiate=(canvasArr,instance,memory,state,eventLoops)=>{
        const wasmMemoryArray = new Uint8Array(memory.buffer);
        canvas = canvasArr[0]
        context = canvas.getContext("2d");
        context.imageSmoothingEnabled = false;
        const bufferOffset = instance.exports.getCanvasBufferPointer();
        wasmCanvas.memory = wasmMemoryArray
        wasmCanvas.offset = bufferOffset
        placeImage = async ()=>{
            let imageDataArray = new Uint8ClampedArray(wasmCanvas.memory.slice(bufferOffset, bufferOffset + inputValues.size**2*4))
            let tempBitmap = await window.createImageBitmap(new ImageData(imageDataArray,inputValues.size,inputValues.size))
            context.drawImage(tempBitmap,0,0,CANVAS_WIDTH,CANVAS_HEIGHT)
        }
        fillRandom = ()=>{
            let filledRatio = inputValues.filledRatio||defaultValues.filledRatio
            instance.exports.fillRandom(filledRatio,inputValues.size)
            placeImage()
        }
        setColor = ()=>{
            instance.exports.setColor(inputValues.color)
        }
        activateCell = (index)=>{
            instance.exports.activateCell(index)
        }
        setColor()
        fillRandom()
        let lastColor = inputValues.color
        const draw = async ()=>{
            if(!state.isPlaying)return
            let iterationCount = inputValues.iterationCount||defaultValues.iterationCount
            let mappedIterationCount = iterationCount/100
            let inverse = Math.floor(1/mappedIterationCount)
            if(mappedIterationCount<1){
                counter++
                if(counter%inverse!=0)return
            }
            let size = inputValues.size||defaultValues.size
            let colorNum = inputValues.color||defaultValues.color
            if(colorNum!=lastColor){
                instance.exports.setColor(colorNum)
                lastColor = colorNum
            }
            instance.exports.iterate(mappedIterationCount,size,colorNum)
            placeImage()
        }
        eventLoops.push(draw)
    
    }
    return [options,wasmOptions]
}}