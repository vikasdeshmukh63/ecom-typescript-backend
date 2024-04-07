// imports
import multer from 'multer';
import { v4 as uuid } from 'uuid';

// storage
const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, './uploads');
  },
  filename(req, file, callback) {
    // genereate random id
    const id = uuid();
    // getting extension name
    const extName = file.originalname.split('.').pop();
    // generating file name
    const fileName = `${id}.${extName}`;
    callback(null, fileName);
  },
});

export const singleUpload = multer({ storage }).single('photo');
