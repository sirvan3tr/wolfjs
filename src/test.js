export const test1 = `
function hello() {
  return "Hello World";
}`;

export const test2 = `
function hello() {
  for(const x in list) {
    console.log(x);
  }
}`

export const test = `
import _ from 'lodash'
import { Auth, API, graphqlOperation } from 'aws-amplify'
import extraData from './data.json'
import { createInserat, updateInserat } from '~/src/graphql/mutations'

export default {
  props: ['ideaId', 'userType'],
  data () {
    const defaultForm = Object.freeze({
      id: '',
      description: '',
      lookingForKeywords: [],
      skillsKeywords: [],
      timeAvailable: 0,
      areasOfResp: ['eng']
    })
    return {
      form: Object.assign({}, defaultForm),
      preview: false,
      previewData: Object,
      isInseratPosted: false,
      description: '',
      keywords: [],
      skillsMsg: '',
      csrftoken: '',
      keywordsDB: {
        skills: {
          processed: new Set(),
          custom: new Set(),
          deleted: new Set()
        },
        description: {
          processed: new Set(),
          custom: new Set(),
          deleted: new Set()
        }
      },
      availability: extraData.availability,
      areasOfRespValues: extraData.areasOfRespValues
    }
  },
  watch: {
    description () {
      this.form.description = this.description
      this.debouncedGetKeywords()
    },
    async preview () {
      this.previewData = await this.getPostData(true)
    }
  },
  mounted () {
    this.keywords = new Set(this.$keywords)
    console.log('idea id is: ', this.ideaId)

    // API.get('innovoteams', '/big5/keywords').then(response => (
    //  this.keywords = new Set(response)
    // ))
    // await axios.get('/api/account/csrf', {
    //   data: null,
    //   headers: { 'Content-Type': 'application/json' }
    // }).then((resp) => {
    //   console.log(resp.data.csrftoken)
    //   this.csrftoken = resp.data.csrftoken
    // })

    // const formData = new FormData()
    // const itemsx = {
    //   csrf_token: this.csrftoken,
    //   username: 'flask-vuejs-admin@example.com',
    //   password: 'password'
    // }
    // for (const key in itemsx) {
    //   formData.append(key, itemsx[key])
    // }
    // await axios.post('/api/account/login/json', formData, {
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    //     'X-CSRF-TOKEN': this.csrftoken
    //   }
    // }).then((response) => {
    //   console.log(response)
    // }).catch((error) => {
    //   console.log(error)
    // })
  },
  created () {
    this.debouncedGetKeywords = _.debounce(this.getKeywords, 500)
  },
  methods: {
    async getPostData (draft = false) {
      const formData = {
        description: this.form.description,
        processedDescription: this.form.lookingForKeywords,
        processedSkills: this.form.skillsKeywords,
        timeAvailable: this.form.timeAvailable,
        areasOfResponsibility: this.form.areasOfResp
      }

      if (this.ideaId !== undefined && this.ideaId !== '') {
        formData.inseratIdeaId = this.ideaId
      }

      if (this.userType !== undefined && this.userType !== '') {
        formData.userType = this.userType.cleanName
      } else {
        return null
      }
      if (draft === true) {
        const user = await Auth.currentAuthenticatedUser()
        formData.createdAt = new Date()
        formData.owner = user.username
      }
      return formData
    },
    async _updateInserat () {
      const formJSON = await this.getPostData()
      formJSON.id = this.form.id
      const resp = await API.graphql(graphqlOperation(updateInserat, { input: formJSON }))
      console.log(resp)
      return resp
    },
    async _createInserat () {
      const formJSON = await this.getPostData()
      if (formJSON === null) {
        console.log('Error getting form data.')
        return null
      }
      const resp = await API.graphql(graphqlOperation(createInserat, { input: formJSON }))
      const returnedData = resp.data.createInserat
      console.log(returnedData)
      return returnedData
    },
    async inseratSaved () {
      if (this.form.description !== '' && this.form.lookingForKeywords.length !== 0) {
        if (this.isInseratPosted) {
          // UPDATE an Idea
          await this._updateInserat()
        } else {
          // POST a new inserat
          const resp = await this._createInserat()
          // Was the Post successful?
          if (resp !== null) {
            this.isInseratPosted = true
            this.form.id = resp.id
            this.$emit('inserat-saved', resp)
          }
        }
      } else {
        console.log('form was not filled in.')
      }

      // Using the quart backend:
      // const formData = new FormData()
      // const itemsx = {
      //   title: 'Hello',
      //   user_type: 'Entrepreneur',
      //   description: 'I am looking f or a asdlfjasd',
      //   processed_description: 'python, java',
      //   user_skills: 'Python',
      //   processed_skills: 'hello, what, no',
      //   idea_id: 3,
      //   cohort_id: 3,
      //   csrf_token: this.csrftoken,
      //   time_available: 2,
      //   experience_years: 3
      // }
      // for (const key in itemsx) {
      //   formData.append(key, itemsx[key])
      // }

      // await axios.post('/api/advert/x', formData, {
      //   withCredentials: true,
      //   headers: {
      //     'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      //     'X-CSRF-TOKEN': this.csrftoken
      //   }
      // }).then((response) => {
      //   console.log(response)
      // }).catch((error) => {
      //   console.log(error)
      // })
    },
    addCustomKeyword (field) {
      const skill = prompt('Please enter a custom skill', '')
      if (skill === null || skill === '') {
        console.log('Cancelled')
      } else {
        this.keywordsDB[field].custom.add(skill)
        this.$forceUpdate()
      }
    },
    getKeywords () {
      this.form.description = this.form.description.toLowerCase()
      const foundKeywords = this.processKeywords(this.form.description)
      const comboSet = new Set(this.form.lookingForKeywords)
      this.form.lookingForKeywords = Array.from(new Set([...comboSet, ...foundKeywords]))
      this.keywordsDB.description.processed = foundKeywords
    },
    processKeywords (txt) {
      const splitTxt = txt.split(/[\s,.!;]+/)
      const foundKeywords = new Set()
      for (const i in splitTxt) {
        let steps = 3
        if (splitTxt.length < steps) {
          steps = splitTxt.length
        } else if (i + steps > splitTxt.length) {
          steps = splitTxt.length
        } else {
          steps = i + steps
        }
        let wordComb = ''
        for (let j = i; j < steps; j++) {
          wordComb = wordComb + ' ' + splitTxt[j]
          wordComb = wordComb.trim()
          if (this.keywords.has(wordComb)) {
            foundKeywords.add(wordComb)
          }
        }
      }
      return foundKeywords
    }
  }
}`;
