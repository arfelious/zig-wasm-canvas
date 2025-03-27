let gameOfLife = {create:function(){
    const DEFAULT_COLOR_NUM = 0x0099ff
    const DEFAULT_COLOR = "#ff9900"
    let noop = ()=>{}
    let options = {}
    options.onInstantiate = noop
    let toNum = (arr)=>arr[0]+arr[1]*256+arr[2]*256*256
    let inputValues = {"iterationCount":100,"size":120,"filledRatio":20,"color":DEFAULT_COLOR_NUM}
    let defaultvalues = {...inputValues}
    let restartAnimation = ()=>{
        if(wasmCanvas.memory){
            wasmCanvas.memory.fill(0)
            context.clearRect(0,0,canvas.width,canvas.height)
        }
        if(typeof options.inputElements!==undefined){
            options.inputElements.forEach(([element,input])=>{
                console.log(input.type)
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
                            element.value = val= DEFAULT_COLOR
                        }
                        inputValues.color = toNum(val.slice(1).match(/.{2}/g).map(val=>parseInt(val,16)))
                    }
                }
            })
        }
        setColor()
        fillRandom()
    }
    let activateCell = noop
    let fillRandom = noop
    options.inputs=[{
        type:"slider",
        scale:"log",
        min:1,
        max:1000,
        value:100,
        label:"Iteration Count",
        id:"iterationCount"
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
                element.value = defaultvalues[input.id]
            })
            restartAnimation()
        }
    },{
        type:"touch",
        label:null,
        id:"touch",
        onChange:(val)=>{
            let x = val.x/canvas.width
            let y = val.y/canvas.height
            let i = Math.floor(x*inputValues.size)
            let j = Math.floor(y*inputValues.size)
            let index = i+j*inputValues.size
            activateCell(index)
            placeImage()
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
            context.drawImage(tempBitmap,0,0,360,360)
        }
        fillRandom = ()=>{
            let filledRatio = inputValues.filledRatio||defaultvalues.filledRatio
            instance.exports.fillRandom(filledRatio,inputValues.size)
            placeImage()
        }
        setColor = ()=>{
            instance.exports.setColor(inputValues.color)
        }
        setColor()
        fillRandom()
        let lastColor = inputValues.color
        const draw = async ()=>{
            if(!state.isPlaying)return
            let iterationCount = inputValues.iterationCount||defaultvalues.iterationCount
            let mappedIterationCount = iterationCount/100
            counter++
            let inverse = Math.floor(1/mappedIterationCount)
            if(mappedIterationCount<1){
                //console.log("iterationCount",counter,inverse,counter%inverse)
                if(counter%inverse!=0)return
            }
            let size = inputValues.size||defaultvalues.size
            let colorNum = inputValues.color||defaultvalues.color
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