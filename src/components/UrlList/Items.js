import dynamic from 'next/dynamic'
import { useState } from 'react'
import {
  Link,
  Text,
  List,
  ListItem,
  Input,
  IconButton,
  useColorModeValue,
  HStack
} from '@chakra-ui/react'

import { HiShare, HiDuplicate, HiPencil, HiTrash, HiSave } from 'react-icons/hi'

import { supabase } from '../../libs/supabase'
import { sanitizeSlug } from '../../libs/helpers'

import { useAlertContext } from '../../context/Alert'

import useUrls from '../../hooks/useUrls'

import { HOME } from '../../constants/paths'

import { ErrorDataNotFound } from '../ErrorDataNotFound'
import { LoadingSkeleton } from './LoadingSkeleton'

const copy = dynamic(() => import('copy-to-clipboard'), { ssr: false })

export const Items = ({ user, isFormVisible, onShowForm }) => {
  const { data, isLoading } = useUrls(user.id)

  const { showAlert, hideAlert } = useAlertContext()
  const [updateId, setUpdateId] = useState('')
  const [updateSlug, setUpdateSlug] = useState('')

  const handleCopy = async (text) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    } else {
      copy(text)
    }
  }

  const handleShare = async (url) => {
    if (navigator.share) {
      const res = await fetch(`https://oge.now.sh/api?url=${decodeURIComponent(url)}`)
      const d = await res.json()

      const shareObj = {
        title: d.title,
        text: d.description,
        url: url
      }

      navigator
        .share(shareObj)
        .then(() => console.log('Successful share', shareObj))
        .catch((error) => console.log('Error sharing', error, shareObj))
    }
  }

  const handleClickEdit = async (id) => {
    if (updateId === id) {
      setUpdateId('')
      setUpdateSlug('')
    } else {
      setUpdateId(id)
      setUpdateSlug('')
    }
  }

  const handleChangeUpdatedSlug = async (e) => {
    const value = e.target.value
    setUpdateSlug(value)
  }

  const handleClickSave = async () => {
    if (updateSlug) {
      await supabase
        .from('urls')
        .update({ slug: sanitizeSlug(updateSlug) })
        .match({ id: updateId })

      setUpdateId('')
      setUpdateSlug('')
    }
  }

  const onConfimDelete = async (id) => {
    await supabase.from('urls').delete().match({ id: id })

    hideAlert()
    // hard reload to refresh data
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const handleDelete = async (id, slug) => {
    showAlert({
      title: 'Konfirmasi hapus',
      message: `Apakah kamu yakin untuk menghapus data ${HOME}${slug}? Aksi ini juga akan menghilangkan semua data statistik terkait.`,
      cancelText: 'Batalkan',
      confirmText: 'Ya, hapus',
      onConfirm: () => {
        onConfimDelete(id)
      },
      onCancel: hideAlert
    })
  }

  if (isLoading) {
    return <LoadingSkeleton/>
  }

  return (
    <>
      {!isLoading && data && data.length > 0 ? (
        <List spacing={3}>
          {data.map((d) => (
            <ListItem
              key={d.slug}
              w={'full'}
              bg={useColorModeValue('white', 'gray.800')}
              boxShadow={'2xl'}
              rounded={'md'}
              overflow={'hidden'}
              p={6}
            >
              <Link
                as="a"
                fontSize="xl"
                fontWeight="700"
                color="orange.400"
                href={`${HOME}${d.slug}`}
                mb="4"
                display="block"
              >
                {`${HOME}${d.slug}`}
              </Link>

              {updateId && updateId === d.id && (
                <HStack alignItems="center" mb="4" mt="2">
                  <Input
                    size="lg"
                    name="slug"
                    placeholder={'Tulis slug baru'}
                    bg={useColorModeValue('blackAlpha.100', 'whiteAlpha.100')}
                    border={0}
                    value={updateSlug}
                    onChange={handleChangeUpdatedSlug}
                  />

                  <IconButton
                    onClick={handleClickSave}
                    aria-label="Simpan slug"
                    size="lg"
                    bg="orange.400"
                    icon={<HiSave color="#FFF" />}
                  />
                </HStack>
              )}

              <Text fontSize="small" color="gray.400">
                {d.real_url}
              </Text>
              <Text fontSize="small" color="gray.400">
                {d.hit} kali dikunjuingi
              </Text>
              <HStack spacing={2} mt={4}>
                <IconButton
                  onClick={() => {
                    handleCopy(`${HOME}${d.slug}`)
                  }}
                  aria-label="Copy"
                  fontSize="20px"
                  variant="ghost"
                  icon={<HiDuplicate color="#ED8936" />}
                />
                <IconButton
                  onClick={() => {
                    handleShare(`${HOME}${d.slug}`)
                  }}
                  aria-label="Copy"
                  fontSize="20px"
                  variant="ghost"
                  icon={<HiShare color="#ED8936" />}
                />
                <IconButton
                  onClick={() => {
                    handleClickEdit(d.id, d.slug)
                  }}
                  aria-label="Ubah"
                  fontSize="20px"
                  variant="ghost"
                  icon={<HiPencil color="#ED8936" />}
                />
                <IconButton
                  onClick={() => {
                    handleDelete(d.id, d.slug)
                  }}
                  aria-label="Hapus"
                  fontSize="20px"
                  variant="ghost"
                  icon={<HiTrash color="#ED8936" />}
                />
              </HStack>
            </ListItem>
          ))}
        </List>
      ) : (
        <>{!isFormVisible ? <ErrorDataNotFound useCta ctaAction={onShowForm} /> : null}</>
      )}
    </>
  )
}