import {QueryDocumentSnapshot} from "firebase-functions/lib/providers/firestore";
import * as functions from "firebase-functions";

export const getDocumentsFromQuerySnapshot = (snapshot: QueryDocumentSnapshot) => {
  functions.logger.log('snapshot without.data: ', snapshot);
  functions.logger.log('snapshot foreach');
  
  // @ts-ignore
  if (snapshot.empty) {
    functions.logger.log('No matching documents');
    return;
  }
  const documents: any[] = [];
  // @ts-ignore
  snapshot.forEach(doc => documents.push(doc.data()));
  return documents;
};