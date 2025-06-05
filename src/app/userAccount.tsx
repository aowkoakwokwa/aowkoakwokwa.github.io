import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { Box, Input, Button, Checkbox, Select, Option, Avatar, Tooltip } from '@mui/joy';
import UserAccountTable from './userAccountTable';
import { useCheckedAccount } from '../../store/store';
import React, { forwardRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { SnackbarProvider, enqueueSnackbar, SnackbarKey, SnackbarMessage } from 'notistack';
import { insertAccountData } from '@/lib/insertData';
import { editAccountData } from '@/lib/editData';
import { deleteAccountData } from '@/lib/deleteData';
import CustomSnackbar from './customSnackbar';

interface FormData {
  username: string;
  password: string;
  pc_name: string;
  hak_akses: string;
  user_level: string;
  departemen: string;
  image: string;
}

export default function UserAccount({ open, close }: { open: boolean; close: () => void }) {
  const {
    control,
    reset,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      username: '',
      password: '',
      pc_name: '',
      hak_akses: '',
      user_level: '',
      departemen: '',
      image: '',
    },
  });

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { checkedAccountRows, resetCheckedAccounts } = useCheckedAccount();
  const queryClient = useQueryClient();
  const objectRows = Object.values(checkedAccountRows);
  const isInputDisabledNew = objectRows.length === 0 && !isAddingNew;
  const isInputDisabledEdit = objectRows.length > 0 && !isEdit;
  const prevObjectRows = useRef<object[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data: Expected an object but received null or undefined');
      }

      if (isEdit) {
        return await editAccountData(data);
      } else if (isDelete) {
        setIsDelete(false);
        if (!data.id) {
          throw new Error('Invalid data: Missing required "id" field for deletion');
        }
        resetCheckedAccounts();
        return await deleteAccountData(data.id);
      }
      setIsAddingNew(false);
      return await insertAccountData(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getUserAccount'] });
      reset();
      setPreviewImage(null);
      setSelectedFile(null);
      resetCheckedAccounts();
    },
    onError: (error) => {
      console.error('Mutation Error:', error);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSaveMutation = async () => {
    try {
      const formValues = getValues();

      if (
        Object.entries(formValues).some(([key, value]) => key !== 'image' && value.trim() === '')
      ) {
        enqueueSnackbar('Data tidak boleh kosong!', { variant: 'error' });
        return;
      }

      let uploadedImageUrl = formValues.image;
      if (selectedFile) {
        uploadedImageUrl = await handleUploadImage();
        if (!uploadedImageUrl) {
          enqueueSnackbar('Gagal mengupload gambar!', { variant: 'error' });
          return;
        }
      }

      const finalFormValues = { ...formValues, image: uploadedImageUrl, users: 'admin' };
      await mutation.mutateAsync(finalFormValues);
      enqueueSnackbar('Data berhasil disimpan!', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Gagal menyimpan data!', { variant: 'error' });
    }
  };

  const handleUploadImage = async (): Promise<string> => {
    if (!selectedFile) return '';

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('/api/upload/profile', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload gagal');

      const data = await response.json();
      return data.url || '';
    } catch (error) {
      return '';
    }
  };

  const handleUploadMutation = async () => {
    try {
      if (objectRows.length === 0) {
        return;
      }

      const formValues = getValues() as FormData;

      const isEmptyField = Object.values(formValues).some(
        (value) => value === '' || value === null,
      );

      let uploadedImageUrl = formValues.image;
      if (selectedFile) {
        uploadedImageUrl = await handleUploadImage();
        if (!uploadedImageUrl) {
          enqueueSnackbar('Gagal mengupload gambar!', { variant: 'error' });
          return;
        }
      }

      if (isEmptyField) {
        enqueueSnackbar('Data tidak boleh kosongs !', { variant: 'error' });
        return;
      }

      const formData = { ...formValues, id: objectRows[0]?.id ?? '', image: uploadedImageUrl };
      handleUploadImage();
      await mutation.mutateAsync(formData);
      enqueueSnackbar('Data berhasil disimpan !', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Gagal menyimpan data !', { variant: 'error' });
    }
  };

  const handleDeleteMutation = async () => {
    try {
      if (objectRows.length === 0) {
        console.error('Tidak ada data yang dipilih untuk dihapus.');
        return;
      }

      const formData = { id: objectRows[0]?.id ?? '' };
      await mutation.mutateAsync(formData);
      enqueueSnackbar('Data berhasil dihapus !', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Gagal menghapus data !', { variant: 'error' });
    }
  };

  useEffect(() => {
    if (JSON.stringify(prevObjectRows.current) !== JSON.stringify(objectRows)) {
      prevObjectRows.current = objectRows;

      if (objectRows.length > 0) {
        setIsAddingNew(false);
        const userData = objectRows[0];

        reset({
          username: userData.username || '',
          password: userData.password || '',
          pc_name: userData.pc_name || '',
          hak_akses: userData.hak_akses || '',
          user_level: userData.user_level || '',
          departemen: userData.departemen || '',
          image: userData.image || '',
        });
      } else {
        reset({
          username: '',
          password: '',
          pc_name: '',
          hak_akses: '',
          user_level: '',
          departemen: '',
          image: '',
        });
        setIsEdit(false);
        setIsDelete(false);
      }
    }
  }, [objectRows, reset]);

  return (
    <Dialog open={open} onClose={close} maxWidth="md" fullWidth>
      <form>
        <DialogTitle>User Account</DialogTitle>
        <DialogContent sx={{ pb: 1, px: 4 }}>
          <div className="flex flex-row">
            <div className="w-full pr-3">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box>
                  <label htmlFor="username">
                    Username<span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="username"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        required
                        placeholder="Type anything.."
                        disabled={isInputDisabledNew || isInputDisabledEdit}
                        autoComplete="off"
                      />
                    )}
                  />
                </Box>

                <Box>
                  <label htmlFor="password">
                    Password<span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        required
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Type anything.."
                        disabled={isInputDisabledNew || isInputDisabledEdit}
                        autoComplete="off"
                      />
                    )}
                  />
                </Box>

                <Box>
                  <label htmlFor="pc_name">
                    PC Name<span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="pc_name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        required
                        placeholder="Type anything.."
                        disabled={isInputDisabledNew || isInputDisabledEdit}
                        autoComplete="off"
                      />
                    )}
                  />
                </Box>

                <Box>
                  <label htmlFor="hak_akses">
                    Hak Akses<span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="hak_akses"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        placeholder="Choose one.."
                        required
                        slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                        disabled={isInputDisabledNew || isInputDisabledEdit}
                        onChange={(_, newValue) => field.onChange(newValue)}
                      >
                        <Option value="Kalibrasi">Kalibrasi</Option>
                        <Option value="NCR">NCR</Option>
                        <Option value="Semua">Semua</Option>
                      </Select>
                    )}
                  />
                </Box>

                <Box>
                  <label htmlFor="user_level">
                    User Level<span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="user_level"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        placeholder="Choose one.."
                        required
                        slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                        disabled={isInputDisabledNew || isInputDisabledEdit}
                        onChange={(_, newValue) => field.onChange(newValue)}
                      >
                        <Option value="User">User</Option>
                        <Option value="Admin">Admin</Option>
                      </Select>
                    )}
                  />
                </Box>

                <Box>
                  <label htmlFor="departemen">
                    Departemen<span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="departemen"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        placeholder="Choose one.."
                        required
                        slotProps={{ listbox: { sx: { zIndex: 1300 } } }}
                        disabled={isInputDisabledNew || isInputDisabledEdit}
                        onChange={(_, newValue) => field.onChange(newValue)}
                      >
                        <Option value="Floating">Floating</Option>
                        <Option value="Cementing">Cementing</Option>
                        <Option value="Semua">Semua</Option>
                      </Select>
                    )}
                  />
                </Box>

                <Checkbox
                  label="Lihat Password"
                  onChange={() => setShowPassword(!showPassword)}
                  disabled={isInputDisabledNew || isInputDisabledEdit}
                />
              </Box>
            </div>
            <div className="w-full pl-3 flex flex-col justify-center">
              <Avatar
                sx={{ width: 188, height: 188, mx: 'auto' }}
                src={previewImage || (objectRows.length > 0 ? objectRows[0].image : '')}
              />

              <div className="mb-4">
                <label className="block font-medium mb-1">Image</label>
                <div className="flex gap-2">
                  <Controller
                    control={control}
                    name="image"
                    render={({ field: { value } }) => (
                      <Tooltip title={!value ? 'Field is required' : ''} arrow>
                        <Input
                          className="w-full px-3 border rounded-lg"
                          placeholder="Pilih file..."
                          value={selectedFile ? selectedFile.name : ''}
                          disabled={isInputDisabledNew || isInputDisabledEdit}
                          readOnly
                        />
                      </Tooltip>
                    )}
                  />
                  <Button
                    className="relative"
                    variant="solid"
                    component="label"
                    disabled={isInputDisabledNew || isInputDisabledEdit}
                  >
                    Upload
                    <div className="absolute h-0 p-0 right-32 overflow-hidden">
                      <input type="file" accept="image/*" hidden onChange={handleFileChange} />
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <Box className="flex flex-row justify-around mt-6">
            {isAddingNew ? (
              <Button type="button" variant="solid" onClick={handleSaveMutation}>
                Save
              </Button>
            ) : (
              <Button onClick={() => setIsAddingNew(true)} disabled={objectRows.length > 0}>
                New
              </Button>
            )}

            {isEdit ? (
              <Button type="button" variant="solid" onClick={handleUploadMutation}>
                Upload
              </Button>
            ) : (
              <Button
                onClick={() => setIsEdit(true)}
                variant="soft"
                disabled={objectRows.length === 0}
              >
                Edit
              </Button>
            )}

            <Button
              variant="soft"
              disabled={objectRows.length === 0 || !isInputDisabledEdit}
              onClick={() => {
                handleDeleteMutation();
                setIsDelete(true);
              }}
            >
              Delete
            </Button>

            <Button
              variant="soft"
              disabled={!isEdit && !isAddingNew}
              onClick={() => {
                setIsAddingNew(false);
                setIsEdit(false);
                reset();
              }}
            >
              Cancel
            </Button>

            <Button
              variant="solid"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['getUserAccount'] })}
            >
              Refresh
            </Button>
          </Box>
        </DialogContent>
      </form>
      <UserAccountTable />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={3000}
        preventDuplicate
        content={(
          key: SnackbarKey,
          message: SnackbarMessage,
          options?: { variant: 'success' | 'error' },
        ) => (
          <CustomSnackbar
            id={String(key)}
            message={String(message)}
            variant={options?.variant || 'success'}
          />
        )}
      ></SnackbarProvider>
      ;
    </Dialog>
  );
}
