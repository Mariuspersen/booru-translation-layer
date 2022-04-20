const inputField = document.getElementById("inputField");
const Picture = document.getElementById("image");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const danbooru = "danbooru.donmai.us";
const gelbooru = "gelbooru.com";
const findId = /[^\/][0-9]+$/;
const cleanURL = /\?.+$/;
const removeFormatting = /<[^>]*>/g;
const getNotes = (website,id) => fetch(`https://${website}/notes.json?group_by=note&search[post_id]=${id}`).then(res => res.json());
const getPost = (website,id) => fetch(`https://${website}/posts/${id}.json`).then(res => res.json());
const wrapText = (context, text, x, y, maxWidth, maxHeight, lineHeight) => {
    context.font = `${lineHeight}px Comic Sans MS`;
    let words = text.split(/[\s\s+,\s]/g);
    words = words.filter(word => word.length !== 0);
    let line = '';
    const tempY = y;
    console.log(words)

    if(words.length === 0) return;

    if(words.length === 1) {
      context.fillText(words[0],x,y,maxWidth);
      return
    }

    if ( maxHeight < lineHeight*2) {
      const textString = words.join(' ');
      context.fillText(textString,x,y,maxWidth)
      return
    }


    words.forEach( word => {
      const testLine = line + word + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && word != words[0]) {
        context.fillText(line,x,y,maxWidth)
        line = word + ' ';
        y += lineHeight;
      }
      else {
        line = testLine;
      }
    });
    context.fillText(line, x, y,maxWidth);
  }
const getWrappedTextHeight = (context, text, maxWidth, lineHeight) => {
    context.font = `${lineHeight}px Comic Sans MS`;

    let words = text.split(/[\s\s+,\s]/g);
    words = words.filter(word => word.length !== 0);

    let line = '';
    let tempY = 0;

    if(words.length === 0) return lineHeight;

    if(words.length === 1) return lineHeight;

    words.forEach( word => {
      const testLine = line + word + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && word != words[0]) {
        //console.log(testWidth,maxWidth, word,words[0]);

        line = word + ' ';
        tempY += lineHeight;
      }
      else {
        line = testLine;
      }
    });
    return tempY;
  }
const getBiggestPossibleFontSize = (context, note) => {
  let textWrappedHeight = 0;
  let iterator = 0;
  while(textWrappedHeight < note.height*.75) {
    textWrappedHeight = getWrappedTextHeight(context, note.body, note.width, iterator);
    //console.log(textWrappedHeight,note.height,iterator,note.body)
    iterator++;
  }
  return iterator-1
}
const overlayTranslations = async(link) => {
  try {
      const cleaned = link ? link.replace(cleanURL,"") : inputField.value.replace(cleanURL,"");
      const matches = cleaned.match(findId);
      if(!matches) return;
      const notes = await getNotes(danbooru,matches);
      const posts = await getPost(danbooru,matches);
      const img = new Image();
      img.src = posts.file_url;        
      img.onload = () => { 
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);
          notes.forEach(note => {
              note.body = note.body.replaceAll(removeFormatting," ")
              const lineHeight = getBiggestPossibleFontSize(context,note)
              context.fillStyle = "#000000DD";
              context.fillRect(note.x,note.y,note.width,note.height)
              context.fillStyle = "#FFFFFFDD";
              wrapText(context, note.body, note.x, note.y+lineHeight, note.width,note.height, lineHeight);
          });
      };
      
  } catch (error) {
      console.error(error);
  }

}

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

if(params.link) {
  console.log(params.link)
  //inputField.style.visibility = "hidden"
  overlayTranslations(params.link);
}

inputField.addEventListener('input',overlayTranslations);