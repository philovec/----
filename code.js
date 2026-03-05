document.addEventListener('DOMContentLoaded', () =>{
    const submitBtn = document.getElementById('submit-btn')
    const menuSelect = document.getElementById('menu')
    const gotoMenu = document.getElementById('goto-menu')

    load()
    submitBtn.addEventListener('click', submit)
    menuSelect.addEventListener('change', e => movePage(e.target.value))
    gotoMenu.addEventListener('click', async () => await movePage('menu'))
})

function errMsg(err){
    console.dir(err)
    alert(err.message)
}

async function postGAS(data){
    const options = {
        method: 'POST',
        body: JSON.stringify(data)
    }

    const request = await fetch('https://script.google.com/macros/s/AKfycbzjqr1OunU1vJ_oqJkJJVi8VqOGdiBIr6-9FIWr0qBBAg5d0rvX2Mnw7qc0yRLQ25vP/exec',options)
    const result = await request.json()

    if(result && result.status === 'error'){
        throw result.errMessage
    } else if(result && result.status === 'success'){
        return result
    } else {
        throw 'GAS側で不明なエラーが発生しました。'
    }
}

function load(){
    const nameList = ['隆太']
    const nameFragment = document.createDocumentFragment()
    nameList.forEach(name => {
        const newOption = document.createElement('option')
        newOption.textContent = name
        nameFragment.appendChild(newOption)
    });

    const nameSelect = document.getElementById('name-select')
    nameSelect.appendChild(nameFragment)
}

function userDisturb(action){
    const nameSelect = document.getElementById('name-select')
    const submitBtn = document.getElementById('submit-btn')

    switch(action){
        case 'start':
            submitBtn.disabled = true
            nameSelect.disabled = true
            break;
        case 'end':
            submitBtn.disabled = false
            nameSelect.disabled = false
            break;
    }
}

async function movePage(action){
    const form = document.getElementById('form')
    const footer = document.getElementById('footer')
    const menu = document.getElementById('menu')
    const read = document.getElementById('read')
    const loading = document.getElementById('loading')

    if(action === 'form'){
        form.classList.remove('hidden')
        footer.classList.remove('hidden')
        menu.classList.add('hidden')
        
    } else if (action === 'read'){
        menu.classList.add('hidden')
        loading.classList.remove('hidden')
        await readLoad()
        loading.classList.add('hidden')
        read.classList.remove('hidden')
        footer.classList.remove('hidden')

    }
    else if (action === 'menu'){
        form.classList.add('hidden')
        footer.classList.add('hidden')
        read.classList.add('hidden')
        menu.classList.remove('hidden')
    }
}

async function getposition(){
    const geo = navigator.geolocation
    return result = new Promise((resolve) =>{
        geo.getCurrentPosition(positionSuccess,positionError,{timeout:5000})

        async function positionSuccess(pos){
            const latitude = pos.coords.latitude
            const longitude = pos.coords.longitude
            const accuracy = pos.coords.accuracy
            const positionData = {
                latitude:latitude,
                longitude:longitude,
                accuracy:accuracy,
            }

            const response = await fetch(`https://geoapi.heartrails.com/api/json?method=searchByGeoLocation&x=${longitude}&y=${latitude}`,{method:'GET'})
            
            if(response){
                const addressObj = await response.json()
                const nearest = addressObj.response.location[0]

                const address = nearest.prefecture + nearest.city + nearest.town
                positionData.address = address
            }
            resolve(positionData)
        }

        function positionError(err){
            console.log(err)
            return null
        }
    })
}

async function submit(){
    userDisturb('start')
    try{
        const name = document.getElementById('name-select').value
        const date = new Date()
        const position = await getposition()

        const data = {
            action:'submit',
            name:name,
            date:date,
            position:position,
        }

        await postGAS(data)
        alert('送信しました。')
        //location.reload()
    } catch(e){
        errMsg(e)
    } finally{
        userDisturb('end')
    }
}

async function readLoad(){
    userDisturb('start')
    const request = {
        action: 'read'
    }
    const result = await postGAS(request)
    const dataList = result.data

    const fragment = document.createDocumentFragment()
    dataList.forEach(row =>{
        const newTr = document.createElement('tr')
        row.forEach(data =>{
            const newTd = document.createElement('td')
            newTd.textContent = data
            newTr.appendChild(newTd)
        })
        fragment.appendChild(newTr)
    })
    
    const tbody = document.getElementById('tbody')
    tbody.innerHTML = ''
    tbody.appendChild(fragment)
    userDisturb('end')
}