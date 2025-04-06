let RPS = {create:function(){
    const DEFAULT_R = "#ff0000"
    const DEFAULT_P = "#00ff00"
    const DEFAULT_S = "#0000ff"
    const DEFAULT_R_NUM = toNum(toArr(DEFAULT_R))
    const DEFAULT_P_NUM = toNum(toArr(DEFAULT_P))
    const DEFAULT_S_NUM = toNum(toArr(DEFAULT_S))
    let inputValues = {"iterationCount":10,"brushSize":10,"colorR":DEFAULT_R_NUM,"colorP":DEFAULT_P_NUM,"colorS":DEFAULT_S_NUM}
    let defaultValues = {...inputValues}
    const CANVAS_WIDTH = 360
    const CANVAS_HEIGHT = 360
    let noop = ()=>{}
    let options = {}
    options.onInstantiate = noop
    options.defaults = defaultValues
    let colorStateCounter = 0
    let fillBrush = noop
    let restartAnimation = ()=>{
        resetCanvas(wasmCanvas,inputValues,context,canvas,options)
        setColors()
        colorStateCounter = 0
        placeImage()
    }
    options.inputs=[{
        type:"slider",
        scale:"log",
        min:1,
        max:300,
        value:10,
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
        value:10,
        label:"Brush Size",
        id:"brushSize",
        onChange:(ev)=>{
            inputValues.brushSize = ev.target.value
        }
    },
    {
        type:"text",
        value:DEFAULT_R,
        label:"Color 1",
        id:"color",
        name:"colorR",
    },{
        type:"text",
        value:DEFAULT_P,
        label:"Color 2",
        id:"color",
        name:"colorP",
    },{
        type:"text",
        value:DEFAULT_S,
        label:"Color 3",
        id:"color",
        name:"colorS",
    },{
        type:"button",
        label:"Restart",
        id:"restart",
        onChange:restartAnimation
    },{        
    type:"touch-move",
    label:null,
    id:"touch",
    onChange:(coords,isClicked)=>{
        let {x,y} = coords
        if(isClicked){
            x=Math.floor(x)
            y=Math.floor(y)
            fillBrush(inputValues.brushSize,x,y)
            placeImage()
        }
    }},
    {
        type:"touch-end",
        label:null,
        id:"touchEnd",
        onChange:(coords,isClicked)=>{
            if(isClicked)return
            colorStateCounter = (colorStateCounter + 1) % 3
        }
    },{
        type:"button",
        label:"Reset",
        id:"reset",
        onChange:(val)=>{
            options.inputElements.forEach(([element,input])=>{
                let curr = defaultValues[input.name??input.id]
                if(input.id=="color"&&typeof curr=="number"){
                    curr=toStr(curr)
                }
                element.value = curr
            })
            inputValues = {...defaultValues}
            restartAnimation()
        }
    }
    ]
    options.isWasm=true
    options.canvasCount = 1
    options.title="RPS"
    let wasmOptions = {}
    wasmOptions.pageCount = 64
    wasmOptions.url="/interactive/zig/rps/zig-out/bin/interactive.wasm"
    wasmOptions.importObject = {jsRand:(max,limit)=>limit?Math.floor(Math.random()*(max-2))+1:Math.floor(Math.random()*max)}
    let wasmCanvas = {memory:null,offset:null}
    let canvas=null,context = null
    let counter = 0
    let placeImage = noop
    let setColor = noop
    let setColors = ()=>{
        setColor(inputValues.colorR,0)
        setColor(inputValues.colorP,1)
        setColor(inputValues.colorS,2)
    }
    wasmOptions.onInstantiate=(canvasArr,instance,memory,state,eventLoops)=>{
        const wasmMemoryArray = new Uint8Array(memory.buffer);
        canvas = canvasArr[0]
        context = canvas.getContext("2d");
        context.imageSmoothingEnabled = false;
        const bufferOffset = instance.exports.getCanvasBufferPointer();
        wasmCanvas.memory = wasmMemoryArray
        wasmCanvas.offset = bufferOffset
        placeImage = async ()=>{
            let imageDataArray = new Uint8ClampedArray(wasmCanvas.memory.slice(bufferOffset, bufferOffset + CANVAS_WIDTH*CANVAS_HEIGHT*4))
            let tempBitmap = await window.createImageBitmap(new ImageData(imageDataArray,CANVAS_WIDTH,CANVAS_HEIGHT))
            context.drawImage(tempBitmap,0,0,CANVAS_WIDTH,CANVAS_HEIGHT)
        }
        fillBrush = (brushSize,x,y)=>{
            let currColor = [inputValues.colorR,inputValues.colorP,inputValues.colorS][colorStateCounter]
            instance.exports.fillBrush(brushSize,x,y,currColor)
            instance.exports.placeImage()
        }
        setColor = (colorNum,state=colorStateCounter)=>{
            instance.exports.setColor(colorNum,state)
        }
        setColors()
        const draw = async ()=>{
            if(!state.isPlaying)return
            let iterationCount = inputValues.iterationCount||defaultValues.iterationCount
            let mappedIterationCount = iterationCount/10
            let inverse = Math.floor(1/mappedIterationCount)
            if(mappedIterationCount<1){
                counter++
                if(counter%inverse!=0)return
            }
            instance.exports.iterate(Math.max(1,mappedIterationCount))
            placeImage()
        }
        eventLoops.push(draw)
    }
    return [options,wasmOptions]

}}