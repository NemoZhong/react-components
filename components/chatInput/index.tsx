import React, { useEffect, useRef, useCallback,useImperativeHandle,forwardRef } from 'react'
import './index.less'
import {emojiMap,emojiName,emojiUrl} from '@/utils/emojiMap'    // 腾讯即时腾讯项目  tim
import {debounce} from 'lodash'
import { isIOS } from '@/utils/utils'

// native emoji --- demo(github react-input-emoji)
// import 'emoji-mart/css/emoji-mart.css'
// import { NimblePicker } from 'emoji-mart'
// import { data } from 'emoji-mart/data/apple.json'
// import { EmojiArray } from './locale-emoji'  (EmojiArray=['1F600-1F64F'])


/*  使用原生emoji 需要使用的部分
    const filterEmoji=(emoji:any)=>{
        if(EmojiArray.include(emoji.unified)){
            return emoji
        }
        return null
    }

    const excluePicker=['recent','search','food','activity','places','objects','symbols','flags','nature']

    <NimblePicker  data={data} i18n={{categories:{recent:'常用',people:'所有表情}}} emojiToshowFilter={filterEmoji} 
        onSelect={handleSelectEmoji}
        exclude={excluePicker}
        native set="apple" showPreview={false} showSkinTones={false}/>
*/ 


function InputEmoji ({
    value,
    onInput,
    cleanOnEnter,
    onEnter,
    onClick,
    onFocus,
    onBlur,
    onCompositionStart,
    onCompositionEnd,
    className='',
    onKeyDown,
    isInputEmpty
  }, ref) {
    
    const textInputRef = useRef(null)
    const cleanedTextRef = useRef('')
  
    const focusEnd=()=>{
        const obj=textInputRef.current
        if(obj){
            if(window.getSelection){
                obj.focus()
                const range=window.getSelection()

            }
        }
    }

    const handleSelectEmoji=(emoji)=>{
        // pasteHtmlAtCaret(emoji.native)
        pasteHtmlAtCaret(getImage(emoji))
        if(!isIOS()){
            textInputRef.current.focus()
        }else{
            focusEnd()
        }
        
        replaceAllTextEmojiToString()
    }

    useImperativeHandle(ref, () => ({
      getValue () {
        replaceAllTextEmojiToString()
        return cleanedTextRef.current
      },
      setValue (text:string) {
        textInputRef.current.innerHTML += text
      },
      focus: () => {
        textInputRef.current.focus()
      },
      blur: () => {
        replaceAllTextEmojiToString()
      },
      clearText(){
        if(cleanOnEnter){
            updateHTML('')
        }
        cleanedTextRef.current=''
      },
      handleSelectEmoji
    }))
  
    const replaceAllTextEmojis = useCallback((text) => {
      let allEmojis = getAllEmojisFromText(text)
  
      if (allEmojis) {
        allEmojis = [...new Set(allEmojis)] // remove duplicates
  
        allEmojis.forEach(emoji => {
          
          text = replaceAll(
            text,
            emoji,
            `<img style="width:20px;height:20px;" data-emoji="${emoji}" src=${emojiUrl}${emojiMap[emoji]} />`
          )
        })
      }
  
      return text
    }, [])
  
    const updateHTML = useCallback((nextValue) => {
      nextValue = nextValue || value
      textInputRef.current.innerHTML = replaceAllTextEmojis(nextValue || '')
    }, [replaceAllTextEmojis])
  
  
    const emitChange = useCallback(() => {
      if (typeof onInput === 'function') {
        onInput(cleanedTextRef.current)
      }
  
      if (typeof isInputEmpty === 'function') {
        isInputEmpty(cleanedTextRef.current.trim()==='')
      }
    }, [onInput, isInputEmpty])
  
    useEffect(() => {
      function handleCopy (e) {
        const selectedText = window.getSelection()
  
        let container = document.createElement('div')
  
        for (let i = 0, len = selectedText.rangeCount; i < len; ++i) {
          container.appendChild(selectedText.getRangeAt(i).cloneContents())
        }
  
        container = replaceEmojiToString(container)
  
        e.clipboardData.setData('text', container.innerText)
        e.preventDefault()
  
        function replaceEmojiToString (container) {
          const images = Array.prototype.slice.call(container.querySelectorAll('img'))
  
          images.forEach(image => {
            image.outerHTML = image.dataset.emoji
          })
  
          return container
        }
      }
  
      function handlePaste (e) {
        e.preventDefault()
        let content
            // @ts-ignore
        if (window.clipboardData) {
                // @ts-ignore
          content = window.clipboardData.getData('Text')
          content = replaceAllTextEmojis(content)
          if (window.getSelection) {
            var selObj = window.getSelection()
            var selRange = selObj.getRangeAt(0)
            selRange.deleteContents()
            selRange.insertNode(document.createTextNode(content))
          }
        } else if (e.clipboardData) {
          content = e.clipboardData.getData('text/plain')
          cleanedTextRef.current += content
          content = replaceAllTextEmojis(content)
          content=content.replace(/\n/gi,'')
          document.execCommand('insertHTML', false, content)
        }
        isInputEmpty(content.trim()==='')
      }
  
      const inputEl = textInputRef.current
  
      const handleContentEditableInputCopyAndPaste = () => {
        inputEl.addEventListener('copy', handleCopy)
        inputEl.addEventListener('paste', handlePaste)
      }
  
      handleContentEditableInputCopyAndPaste()
  
      return () => {
        inputEl.removeEventListener('copy', handleCopy)
        inputEl.removeEventListener('paste', handlePaste)
      }
    }, [replaceAllTextEmojis])
  
    useEffect(() => {
      updateHTML()
    }, [updateHTML])
  
    const replaceAllTextEmojiToString = useCallback(() => {
      if (!textInputRef.current) {
        cleanedTextRef.current = ''
      }
  
      const container = document.createElement('div')
      container.innerHTML = textInputRef.current?.innerHTML
  
      const images = Array.prototype.slice.call(container.querySelectorAll('img'))
  
      images.forEach(image => {
        image.outerHTML = image.dataset.emoji
      })
  
      let text = container.innerText
  
      // remove all ↵ for safari
      text = text.replace(/\n/ig, '')
  
      cleanedTextRef.current = text
  
      emitChange()
    }, [emitChange])
  
    const replaceAllTextEmojiToStringDebounced = debounce(replaceAllTextEmojiToString, 500)
  
    useEffect(() => {
      function handleKeydown (event) {
  
        if (event.keyCode === 13) {
          event.preventDefault()
  
          replaceAllTextEmojiToString()
  
          const cleanedText = cleanedTextRef.current
  
          if (typeof onEnter === 'function') {
            onEnter(cleanedText)
          }
  
          if (cleanOnEnter) {
            updateHTML('')
          }
  
          if (typeof onKeyDown === 'function') {
            onKeyDown(event)
          }
  
          return false
        }
  
        if (typeof onKeyDown === 'function') {
          onKeyDown(event)
        }
      }
  
      function handleKeyup(event) {
        replaceAllTextEmojiToStringDebounced()
      }
  
      const inputEl = textInputRef.current
  
      inputEl.addEventListener('keydown', handleKeydown)
      inputEl.addEventListener('keyup', handleKeyup)
  
      return () => {
        inputEl.removeEventListener('keydown', handleKeydown)
        inputEl.removeEventListener('keyup', handleKeyup)
      }
    }, [onInput, cleanOnEnter, onEnter, updateHTML, replaceAllTextEmojiToString, emitChange, onKeyDown])
  
  
    function pasteHtmlAtCaret (html) {
      let sel=window.getSelection() || document.getSelection()
      let range
      if (!isIOS()) {
        if (sel.getRangeAt && sel.rangeCount) {
          range = sel.getRangeAt(0)
          range.deleteContents()
  
          // Range.createContextualFragment() would be useful here but is
          // non-standard and not supported in all browsers (IE9, for one)
          const el = document.createElement('div')
          el.innerHTML = html
          const frag = document.createDocumentFragment(); var node; var lastNode
          while ((node = el.firstChild)) {
            lastNode = frag.appendChild(node)
          }
          range.insertNode(frag)
  
          // Preserve the selection
          if (lastNode) {
            range = range.cloneRange()
            range.setStartAfter(lastNode)
            range.collapse(true)
            sel.removeAllRanges()
            sel.addRange(range)
          }
        }
            // @ts-ignore
      } else if (document.selection && document.selection.type !== 'Control') {
        // @ts-ignore
        document.selection.createRange().pasteHTML(html)
      }else{
          // ios
          textInputRef.current.innerHTML += html
      }
    }
  
    function replaceAll (str, find, replace) {
      const newFind= find.replace(/\[/g,'\\[').replace(/\]/g,'\\]')
      return str.replace(new RegExp(newFind, 'g'), replace)
    }
  
    function getImage (emoji) {
      return `<img style="width:20px;height:20px;" data-emoji="${emoji}" src=${emojiUrl}${emojiMap[emoji]} />`
    }
  

  
    function getAllEmojisFromText (text) {
      let allEmojiAry=[]
      emojiName.forEach((emoji)=>{
          if(text.indexOf(emoji)!==-1){
              allEmojiAry.push(emoji)
          }
      })
      return allEmojiAry
    }
  
    return (
      <div 
        className={`react-input-emoji ${className}`}
        ref={textInputRef}
        contentEditable
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        onFocus={onFocus}
        onBlur={onBlur}
      >
   
      </div>
    )
  }

  
  export default forwardRef(InputEmoji)