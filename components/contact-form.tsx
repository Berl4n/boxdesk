"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AddressData {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export function ContactForm() {
  const [personType, setPersonType] = useState<"pf" | "pj">("pf")
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [pfData, setPfData] = useState({
    nome: "",
    cpf: "",
    rg: "",
    dataNascimento: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    pontoReferencia: "",
    telefone: "",
    email: "",
    plano: "",
    vencimento: "",
    formaContato: "ligacao",
    horario: "manha",
    comentarios: "",
  })

  const [pjData, setPjData] = useState({
    cnpj: "",
    razaoSocial: "",
    nomeFantasia: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    pontoReferencia: "",
    responsavel: "",
    cpf: "",
    rg: "",
    cargo: "",
    telefone: "",
    email: "",
    plano: "",
    vencimento: "",
    formaContato: "ligacao",
    horario: "manha",
    comentarios: "",
  })

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  const formatCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`
    if (numbers.length <= 12)
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`
  }

  const searchCep = useCallback(async (cep: string, type: "pf" | "pj") => {
    const cleanCep = cep.replace(/\D/g, "")
    if (cleanCep.length !== 8) return

    setIsLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data: AddressData = await response.json()

      if (!data.erro) {
        if (type === "pf") {
          setPfData((prev) => ({
            ...prev,
            endereco: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf,
          }))
        } else {
          setPjData((prev) => ({
            ...prev,
            endereco: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf,
          }))
        }
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
    } finally {
      setIsLoadingCep(false)
    }
  }, [])

  const searchCnpj = useCallback(async (cnpj: string) => {
    const cleanCnpj = cnpj.replace(/\D/g, "")
    if (cleanCnpj.length !== 14) return

    setIsLoadingCnpj(true)
    try {
      const response = await fetch(`https://open.cnpja.com/office/${cleanCnpj}`)
      const data = await response.json()

      if (data && data.taxId) {
        setPjData((prev) => ({
          ...prev,
          razaoSocial: data.company?.name || prev.razaoSocial,
          nomeFantasia: data.alias || prev.nomeFantasia,
          cep: data.address?.zip ? formatCep(data.address.zip) : prev.cep,
          endereco: data.address?.street || prev.endereco,
          numero: data.address?.number || prev.numero,
          complemento: data.address?.details || prev.complemento,
          bairro: data.address?.district || prev.bairro,
          cidade: data.address?.city?.name || data.address?.city || prev.cidade,
          estado: data.address?.state?.code || data.address?.state || prev.estado,
        }))
      }
    } catch (error) {
      console.error("Erro ao buscar CNPJ:", error)
    } finally {
      setIsLoadingCnpj(false)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const data = personType === "pf" ? pfData : pjData
      
      const response = await fetch("https://boxdesk.app.n8n.cloud/webhook-test/contato/f1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipoContato: personType === "pf" ? "Pessoa Física" : "Pessoa Jurídica",
          ...data,
          dataEnvio: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        console.error("Erro ao enviar dados:", response.statusText)
      }

      await new Promise((resolve) => setTimeout(resolve, 1500))
    } catch (error) {
      console.error("Erro ao enviar cadastro:", error)
    } finally {
      setIsSubmitting(false)
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    }
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg border-0">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <img
            src="/images/logo-netway-fibra.png"
            alt="Netway Fibra"
            className="h-10 w-auto object-contain mb-4"
          />
          <h3 className="text-xl font-semibold text-foreground mb-2">Cadastro Enviado!</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Seu cadastro foi realizado com sucesso. Nossa equipe entrara em contato em breve.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-0">
      <CardHeader className="space-y-1 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">Cadastro de Contato</CardTitle>
            <CardDescription className="text-muted-foreground">
              Preencha os dados para entrarmos em contato com você
            </CardDescription>
          </div>
          <img
            src="/images/logo-netway-fibra.png"
            alt="Netway Fibra - Sua rede com o futuro"
            className="h-12 w-auto object-contain"
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex bg-muted rounded-lg p-1">
            <button
              type="button"
              onClick={() => setPersonType("pf")}
              className={`flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                personType === "pf"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pessoa Física
            </button>
            <button
              type="button"
              onClick={() => setPersonType("pj")}
              className={`flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                personType === "pj"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pessoa Jurídica
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {personType === "pf" ? (
            // Formulário Pessoa Física
            <div className="space-y-6">
              {/* DADOS PESSOAIS */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Dados Pessoais</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pf-nome" className="text-foreground">
                      Nome Completo
                    </Label>
                    <Input
                      id="pf-nome"
                      placeholder="Digite seu nome completo"
                      value={pfData.nome}
                      onChange={(e) => setPfData({ ...pfData, nome: e.target.value })}
                      className="bg-card"
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="pf-cpf" className="text-foreground">
                        CPF
                      </Label>
                      <Input
                        id="pf-cpf"
                        placeholder="000.000.000-00"
                        value={pfData.cpf}
                        onChange={(e) => setPfData({ ...pfData, cpf: e.target.value })}
                        className="bg-card"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pf-rg" className="text-foreground">
                        RG
                      </Label>
                      <Input
                        id="pf-rg"
                        placeholder="00.000.000-0"
                        value={pfData.rg}
                        onChange={(e) => setPfData({ ...pfData, rg: e.target.value })}
                        className="bg-card"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pf-nascimento" className="text-foreground">
                        Data de Nascimento
                      </Label>
                      <Input
                        id="pf-nascimento"
                        type="date"
                        value={pfData.dataNascimento}
                        onChange={(e) => setPfData({ ...pfData, dataNascimento: e.target.value })}
                        className="bg-card"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ENDEREÇO COMPLETO */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Endereço Completo / Instalação</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pf-cep" className="text-foreground">
                      CEP
                    </Label>
                    <div className="relative">
                      <Input
                        id="pf-cep"
                        placeholder="00000-000"
                        value={pfData.cep}
                        onChange={(e) => {
                          const formatted = formatCep(e.target.value)
                          setPfData({ ...pfData, cep: formatted })
                          if (formatted.replace(/\D/g, "").length === 8) {
                            searchCep(formatted, "pf")
                          }
                        }}
                        className="bg-card"
                        required
                      />
                      {isLoadingCep && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          Buscando...
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pf-endereco" className="text-foreground">
                      Endereço
                    </Label>
                    <Input
                      id="pf-endereco"
                      placeholder="Rua, Avenida..."
                      value={pfData.endereco}
                      onChange={(e) => setPfData({ ...pfData, endereco: e.target.value })}
                      className="bg-card"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pf-numero" className="text-foreground">
                        Número
                      </Label>
                      <Input
                        id="pf-numero"
                        placeholder="Nº do imóvel"
                        value={pfData.numero}
                        onChange={(e) => setPfData({ ...pfData, numero: e.target.value })}
                        className="bg-card"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pf-complemento" className="text-foreground">
                        Complemento
                      </Label>
                      <Input
                        id="pf-complemento"
                        placeholder="Apto, Bloco, etc."
                        value={pfData.complemento}
                        onChange={(e) => setPfData({ ...pfData, complemento: e.target.value })}
                        className="bg-card"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pf-bairro" className="text-foreground">
                      Bairro
                    </Label>
                    <Input
                      id="pf-bairro"
                      placeholder="Bairro"
                      value={pfData.bairro}
                      onChange={(e) => setPfData({ ...pfData, bairro: e.target.value })}
                      className="bg-card"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pf-cidade" className="text-foreground">
                        Cidade
                      </Label>
                      <Input
                        id="pf-cidade"
                        placeholder="Cidade"
                        value={pfData.cidade}
                        onChange={(e) => setPfData({ ...pfData, cidade: e.target.value })}
                        className="bg-card"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pf-estado" className="text-foreground">
                        UF
                      </Label>
                      <Input
                        id="pf-estado"
                        placeholder="UF"
                        value={pfData.estado}
                        onChange={(e) => setPfData({ ...pfData, estado: e.target.value })}
                        className="bg-card"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pf-referencia" className="text-foreground">
                      Ponto de Referência
                    </Label>
                    <Input
                      id="pf-referencia"
                      placeholder="Ponto de referência para localização"
                      value={pfData.pontoReferencia}
                      onChange={(e) => setPfData({ ...pfData, pontoReferencia: e.target.value })}
                      className="bg-card"
                    />
                  </div>
                </div>
              </div>

              {/* DADOS PARA CONTATO */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Dados para Contato</h3>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pf-telefone" className="text-foreground">
                        Telefone (DDD)
                      </Label>
                      <Input
                        id="pf-telefone"
                        placeholder="(00) 00000-0000"
                        value={pfData.telefone}
                        onChange={(e) => setPfData({ ...pfData, telefone: formatPhone(e.target.value) })}
                        className="bg-card"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pf-email" className="text-foreground">
                        E-mail
                      </Label>
                      <Input
                        id="pf-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={pfData.email}
                        onChange={(e) => setPfData({ ...pfData, email: e.target.value })}
                        className="bg-card"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PLANOS CONTRATADO */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Planos Contratado</h3>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pf-plano" className="text-foreground">
                        Plano
                      </Label>
                      <Select value={pfData.plano} onValueChange={(value) => setPfData({ ...pfData, plano: value })}>
                        <SelectTrigger id="pf-plano" className="bg-card">
                          <SelectValue placeholder="Selecione um plano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plano-1">Plano 1</SelectItem>
                          <SelectItem value="plano-2">Plano 2</SelectItem>
                          <SelectItem value="plano-3">Plano 3</SelectItem>
                          <SelectItem value="plano-4">Plano 4</SelectItem>
                          <SelectItem value="plano-5">Plano 5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pf-vencimento" className="text-foreground">
                        Vencimento
                      </Label>
                      <Select value={pfData.vencimento} onValueChange={(value) => setPfData({ ...pfData, vencimento: value })}>
                        <SelectTrigger id="pf-vencimento" className="bg-card">
                          <SelectValue placeholder="Selecione os dias" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 dias</SelectItem>
                          <SelectItem value="10">10 dias</SelectItem>
                          <SelectItem value="15">15 dias</SelectItem>
                          <SelectItem value="20">20 dias</SelectItem>
                          <SelectItem value="25">25 dias</SelectItem>
                          <SelectItem value="30">30 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              
              <div className="space-y-2">
                <Label htmlFor="pf-comentarios" className="text-foreground">
                  Comentários
                </Label>
                <Textarea
                  id="pf-comentarios"
                  placeholder="Deixe sua mensagem ou observações..."
                  value={pfData.comentarios}
                  onChange={(e) => setPfData({ ...pfData, comentarios: e.target.value })}
                  className="bg-card min-h-24 resize-none"
                />
              </div>
            </div>
          ) : (
            // Formulário Pessoa Jurídica
              <div className="space-y-6">
                {/* DADOS CADASTRAIS PJ */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Dados Cadastrais PJ</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pj-cnpj" className="text-foreground">
                        CNPJ
                      </Label>
                      <div className="relative">
                        <Input
                          id="pj-cnpj"
                          placeholder="00.000.000/0000-00"
                          value={pjData.cnpj}
                          onChange={(e) => {
                            const formatted = formatCnpj(e.target.value)
                            setPjData({ ...pjData, cnpj: formatted })
                            if (formatted.replace(/\D/g, "").length === 14) {
                              searchCnpj(formatted)
                            }
                          }}
                          className="bg-card"
                          required
                        />
                        {isLoadingCnpj && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            Buscando...
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="pj-razao" className="text-foreground">
                          Razão Social
                        </Label>
                        <Input
                          id="pj-razao"
                          placeholder="Razão Social da empresa"
                          value={pjData.razaoSocial}
                          onChange={(e) => setPjData({ ...pjData, razaoSocial: e.target.value })}
                          className="bg-card"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pj-fantasia" className="text-foreground">
                          Nome Fantasia
                        </Label>
                        <Input
                          id="pj-fantasia"
                          placeholder="Nome Fantasia"
                          value={pjData.nomeFantasia}
                          onChange={(e) => setPjData({ ...pjData, nomeFantasia: e.target.value })}
                          className="bg-card"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ENDEREÇO COMPLETO / INSTALAÇÃO */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Endereço Completo / Instalação</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pj-cep" className="text-foreground">
                        CEP
                      </Label>
                      <div className="relative">
                        <Input
                          id="pj-cep"
                          placeholder="00000-000"
                          value={pjData.cep}
                          onChange={(e) => {
                            const formatted = formatCep(e.target.value)
                            setPjData({ ...pjData, cep: formatted })
                            if (formatted.replace(/\D/g, "").length === 8) {
                              searchCep(formatted, "pj")
                            }
                          }}
                          className="bg-card"
                          required
                        />
                        {isLoadingCep && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            Buscando...
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pj-endereco" className="text-foreground">
                        Endereço
                      </Label>
                      <Input
                        id="pj-endereco"
                        placeholder="Rua, Avenida..."
                        value={pjData.endereco}
                        onChange={(e) => setPjData({ ...pjData, endereco: e.target.value })}
                        className="bg-card"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="pj-numero" className="text-foreground">
                          Número
                        </Label>
                        <Input
                          id="pj-numero"
                          placeholder="Nº do imóvel"
                          value={pjData.numero}
                          onChange={(e) => setPjData({ ...pjData, numero: e.target.value })}
                          className="bg-card"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pj-complemento" className="text-foreground">
                          Complemento
                        </Label>
                        <Input
                          id="pj-complemento"
                          placeholder="Sala, Andar, etc."
                          value={pjData.complemento}
                          onChange={(e) => setPjData({ ...pjData, complemento: e.target.value })}
                          className="bg-card"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pj-bairro" className="text-foreground">
                        Bairro
                      </Label>
                      <Input
                        id="pj-bairro"
                        placeholder="Bairro"
                        value={pjData.bairro}
                        onChange={(e) => setPjData({ ...pjData, bairro: e.target.value })}
                        className="bg-card"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="pj-cidade" className="text-foreground">
                          Cidade
                        </Label>
                        <Input
                          id="pj-cidade"
                          placeholder="Cidade"
                          value={pjData.cidade}
                          onChange={(e) => setPjData({ ...pjData, cidade: e.target.value })}
                          className="bg-card"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pj-estado" className="text-foreground">
                          UF
                        </Label>
                        <Input
                          id="pj-estado"
                          placeholder="UF"
                          value={pjData.estado}
                          onChange={(e) => setPjData({ ...pjData, estado: e.target.value })}
                          className="bg-card"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pj-referencia" className="text-foreground">
                        Ponto de Referência
                      </Label>
                      <Input
                        id="pj-referencia"
                        placeholder="Ponto de referência para localização"
                        value={pjData.pontoReferencia}
                        onChange={(e) => setPjData({ ...pjData, pontoReferencia: e.target.value })}
                        className="bg-card"
                      />
                    </div>
                  </div>
                </div>

                {/* REPRESENTANTE LEGAL / SOLICITANTE */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Representante Legal / Solicitante</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pj-responsavel" className="text-foreground">
                        Nome
                      </Label>
                      <Input
                        id="pj-responsavel"
                        placeholder="Nome do responsável"
                        value={pjData.responsavel}
                        onChange={(e) => setPjData({ ...pjData, responsavel: e.target.value })}
                        className="bg-card"
                        required
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="pj-cpf" className="text-foreground">
                          CPF
                        </Label>
                        <Input
                          id="pj-cpf"
                          placeholder="000.000.000-00"
                          value={pjData.cpf}
                          onChange={(e) => setPjData({ ...pjData, cpf: e.target.value })}
                          className="bg-card"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pj-rg" className="text-foreground">
                          RG
                        </Label>
                        <Input
                          id="pj-rg"
                          placeholder="00.000.000-0"
                          value={pjData.rg}
                          onChange={(e) => setPjData({ ...pjData, rg: e.target.value })}
                          className="bg-card"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pj-cargo" className="text-foreground">
                          Cargo
                        </Label>
                        <Input
                          id="pj-cargo"
                          placeholder="Cargo do responsável"
                          value={pjData.cargo}
                          onChange={(e) => setPjData({ ...pjData, cargo: e.target.value })}
                          className="bg-card"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="pj-telefone" className="text-foreground">
                          Telefone (DDD)
                        </Label>
                        <Input
                          id="pj-telefone"
                          placeholder="(00) 00000-0000"
                          value={pjData.telefone}
                          onChange={(e) => setPjData({ ...pjData, telefone: formatPhone(e.target.value) })}
                          className="bg-card"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pj-email" className="text-foreground">
                          E-mail
                        </Label>
                        <Input
                          id="pj-email"
                          type="email"
                          placeholder="empresa@email.com"
                          value={pjData.email}
                          onChange={(e) => setPjData({ ...pjData, email: e.target.value })}
                          className="bg-card"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

              {/* ESCOLHA O PLANO */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Escolha o Plano</h3>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pj-plano" className="text-foreground">
                        Plano
                      </Label>
                      <Select value={pjData.plano} onValueChange={(value) => setPjData({ ...pjData, plano: value })}>
                        <SelectTrigger id="pj-plano" className="bg-card">
                          <SelectValue placeholder="Selecione um plano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plano-1">Plano 1</SelectItem>
                          <SelectItem value="plano-2">Plano 2</SelectItem>
                          <SelectItem value="plano-3">Plano 3</SelectItem>
                          <SelectItem value="plano-4">Plano 4</SelectItem>
                          <SelectItem value="plano-5">Plano 5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pj-vencimento" className="text-foreground">
                        Vencimento
                      </Label>
                      <Select value={pjData.vencimento} onValueChange={(value) => setPjData({ ...pjData, vencimento: value })}>
                        <SelectTrigger id="pj-vencimento" className="bg-card">
                          <SelectValue placeholder="Selecione os dias" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 dias</SelectItem>
                          <SelectItem value="10">10 dias</SelectItem>
                          <SelectItem value="15">15 dias</SelectItem>
                          <SelectItem value="20">20 dias</SelectItem>
                          <SelectItem value="25">25 dias</SelectItem>
                          <SelectItem value="30">30 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pj-comentarios" className="text-foreground">
                  Comentários
                </Label>
                <Textarea
                  id="pj-comentarios"
                  placeholder="Deixe sua mensagem ou observações..."
                  value={pjData.comentarios}
                  onChange={(e) => setPjData({ ...pjData, comentarios: e.target.value })}
                  className="bg-card min-h-24 resize-none"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-medium transition-all duration-200 hover:shadow-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar Cadastro"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 text-base font-medium border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:shadow-md bg-transparent"
              onClick={() => window.open("https://1550.3cx.cloud/boxdesk/", "_blank")}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Fale Conosco
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
