import CustomDialog from '@/components/default/custom-dialog';
import { db } from '@/config/firebase';
import { useData } from '@/libs/data-sources';
import FirestoreDataSource from '@/libs/data-sources/data-sources/FirestoreDataSource';
import { CustomForm } from '@/libs/forms';
import FormButton from '@/libs/forms/components/SubmitButton';
import TextField from '@/libs/forms/components/TextField';
import useCustomFormik from '@/libs/forms/use-custom-formik';
import { Issue, issueFields, issueYupSchema } from '@/schemas/issue';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { Button, DialogContent, DialogTitle, IconButton, Tooltip } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

const issueDatasource = new FirestoreDataSource<Issue>(
  {
    target: 'issues',
    targetMode: 'collection',
    subscribe: false,
    YupValidationSchema: issueYupSchema,
    //mockOptions: { schema: iss },
  },
  { db }
);

const IssueDialog = () => {
  const { t } = useTranslation();
  const datasource = useData<Issue>('issues', { datasource: issueDatasource });
  const [dialogData, setDialogData] = useState<string | undefined>(undefined);
  const formik = useCustomFormik({
    initialValues: { title: '', description: '' },
    validationSchema: issueYupSchema,
    onSubmit: async (values, _formikHelpers) => {
      console.log(values);
      try {
        await datasource.actions.add(values);
        toast.success(t('notifications.submitSuccess', { resource: 'Issue' }));
        formik.resetForm();
      } catch (e) {
        toast.error(t('notifications.submitError', { resource: 'Issue' }));
        console.error(e);
      }
    },
  });

  return (
    <>
      <Tooltip title="Report a problem">
        <IconButton
          onClick={() => setDialogData('true')}
          color="inherit"
        >
          <ReportProblemIcon />
        </IconButton>
      </Tooltip>
      {dialogData && (
        <CustomDialog
          data={dialogData}
          setData={setDialogData}
        >
          <DialogTitle>Submit an Issue</DialogTitle>
          <DialogContent>
            <CustomForm
              formik={formik}
              options={{
                muiTextFieldProps: { fullWidth: true },
              }}
            >
              <TextField
                name="title"
                field={issueFields.title}
              />
              <TextField
                name="description"
                field={issueFields.description}
              />
              <FormButton>Submit</FormButton>
              <Button
                color="primary"
                onClick={async () => {
                  datasource.actions.getAll().then((d: any) => console.log(d));
                }}
                variant="outlined"
              >
                Get issues
              </Button>
            </CustomForm>
          </DialogContent>
        </CustomDialog>
      )}
    </>
  );
};

export default IssueDialog;
